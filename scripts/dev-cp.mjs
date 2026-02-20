#!/usr/bin/env node
// dev-cp.mjs — starts Wrangler dev for the Cloudflare Containers proxy stack.
//
// The container image is pulled from Docker Hub:
//   docker.io/zintrust/zintrust-proxy:latest
//
// The thin wrapper Dockerfile at docker/containers-proxy-dev/Dockerfile
// simply `FROM`s that Hub image, so Wrangler's buildx step will pull it
// automatically on first run (or when the local build cache is cold).
//
// Options:
//   --pull / --build   Run `docker pull` to refresh the Hub image first
//   --env <name>       Wrangler environment (default: staging)
//   -c <path>          Wrangler config file (default: wrangler.containers-proxy.dev.jsonc)

import { spawn, spawnSync } from 'node:child_process';

const hasFlag = (flag) => process.argv.includes(flag);

const readFlagValue = (flag) => {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('-')) return undefined;
  return next;
};

const ENV = readFlagValue('--env') ?? readFlagValue('-e') ?? 'staging';
const CONFIG =
  readFlagValue('--wrangler-config') ??
  readFlagValue('-c') ??
  'wrangler.containers-proxy.dev.jsonc';

const HUB_IMAGE = 'docker.io/zintrust/zintrust-proxy:latest';
const SHOULD_PULL = hasFlag('--pull') || hasFlag('--build');

const MAX_CAPTURE_CHARS = 200_000;

const capAppend = (buffer, chunk) => {
  const next = buffer + chunk;
  if (next.length <= MAX_CAPTURE_CHARS) return next;
  return next.slice(next.length - MAX_CAPTURE_CHARS);
};

const isWranglerCloudflareDevRmiMissingImage = (combinedOutput) => {
  const out = String(combinedOutput ?? '');
  return (
    out.includes('Failed running docker command: Command failed: docker rmi cloudflare-dev/') &&
    out.includes('Error response from daemon: No such image: cloudflare-dev/')
  );
};

const extractCloudflareDevImageRefs = (combinedOutput) => {
  const out = String(combinedOutput ?? '');
  const found = new Set();

  // Example line:
  //   Command failed: docker rmi cloudflare-dev/zintrustmysqlproxycontainer:5e0a785f
  const rmiRe = /docker rmi\s+(cloudflare-dev\/[^\s]+)\b/g;
  for (;;) {
    const m = rmiRe.exec(out);
    if (!m) break;
    found.add(m[1]);
  }

  // Example line:
  //   Error response from daemon: No such image: cloudflare-dev/...
  const noSuchRe = /No such image:\s*(cloudflare-dev\/[^\s]+)\b/g;
  for (;;) {
    const m = noSuchRe.exec(out);
    if (!m) break;
    found.add(m[1]);
  }

  // Example line:
  //   Uncaught Error: No such image available named cloudflare-dev/xyz:abcd
  const noSuchAvailableRe = /No such image available named\s+(cloudflare-dev\/[^\s]+)\b/g;
  for (;;) {
    const m = noSuchAvailableRe.exec(out);
    if (!m) break;
    found.add(m[1]);
  }

  return Array.from(found);
};

const dockerTag = (source, target) => {
  const result = spawnSync('docker', ['tag', source, target], {
    stdio: 'inherit',
    env: process.env,
  });
  return typeof result.status === 'number' ? result.status : 1;
};

const runWithLiveOutput = async (command, args) => {
  const child = spawn(command, args, {
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  let captured = '';
  let rolling = '';
  const seeded = new Set();

  const maybeSeedFromOutput = (chunkText) => {
    rolling = capAppend(rolling, chunkText);
    const refs = extractCloudflareDevImageRefs(rolling);
    for (const ref of refs) {
      if (seeded.has(ref)) continue;
      seeded.add(ref);
      // Seed the exact tag Wrangler is looking for from the known-good Hub image.
      // This is a dev-only workaround for Wrangler/Miniflare container image tagging quirks.
      try {
        process.stderr.write(`\n[dev:cp] Seeding missing image tag: ${ref}\n`);
      } catch {
        // ignore
      }
      dockerTag(HUB_IMAGE, ref);
    }
  };

  child.stdout?.on('data', (d) => {
    const s = d.toString('utf8');
    process.stdout.write(s);
    captured = capAppend(captured, s);
    maybeSeedFromOutput(s);
  });
  child.stderr?.on('data', (d) => {
    const s = d.toString('utf8');
    process.stderr.write(s);
    captured = capAppend(captured, s);
    maybeSeedFromOutput(s);
  });

  const result = await new Promise((resolve) => {
    child.on('close', (code, signal) => resolve({ code, signal }));
  });

  // Normalize Ctrl+C / SIGTERM to a clean exit.
  if (result.signal === 'SIGINT' || result.signal === 'SIGTERM') {
    return { exitCode: 0, output: captured };
  }
  if (typeof result.code === 'number') {
    return { exitCode: result.code, output: captured };
  }
  return { exitCode: 1, output: captured };
};

if (SHOULD_PULL) {
  console.log(`[dev:cp] Pulling latest image from Docker Hub: ${HUB_IMAGE}`);
  const result = spawnSync('docker', ['pull', HUB_IMAGE], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`[dev:cp] docker pull failed (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

// Wrangler (as of some versions) can fail hard on a cleanup step:
//   docker rmi cloudflare-dev/<name>:<hash>
// when that image tag doesn't exist yet. In that case, we seed the missing
// tag(s) from the Hub image and retry.
const WRANGLER_RETRIES = 10;
for (let attempt = 1; attempt <= WRANGLER_RETRIES; attempt += 1) {
  const result = await runWithLiveOutput('./bin/z.ts', [
    'docker',
    '--wrangler-config',
    CONFIG,
    '--env',
    ENV,
  ]);

  if (result.exitCode === 0) process.exit(0);

  if (!isWranglerCloudflareDevRmiMissingImage(result.output)) {
    process.exit(result.exitCode);
  }

  const missing = extractCloudflareDevImageRefs(result.output);
  if (missing.length === 0) {
    process.exit(result.exitCode);
  }

  console.error(
    `\n[dev:cp] Wrangler failed due to missing cloudflare-dev image tag(s). Seeding from ${HUB_IMAGE}...`
  );

  for (const tag of missing) {
    console.error(`[dev:cp] docker tag ${HUB_IMAGE} ${tag}`);
    const status = dockerTag(HUB_IMAGE, tag);
    if (status !== 0) {
      console.error(`[dev:cp] Failed to seed tag: ${tag} (exit ${status})`);
      process.exit(status);
    }
  }

  console.error(`[dev:cp] Retry ${attempt}/${WRANGLER_RETRIES}...\n`);
}

process.exit(1);
