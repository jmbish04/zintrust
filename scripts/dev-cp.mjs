#!/usr/bin/env node
// dev-cp.mjs — starts Wrangler dev for the Cloudflare Containers proxy stack.
//
// The container image is pulled from Docker Hub:
//   docker.io/zintrust/zintrust:latest
//
// The thin wrapper Dockerfile at docker/containers-proxy-dev/Dockerfile
// simply `FROM`s that Hub image, so Wrangler's buildx step will pull it
// automatically on first run (or when the local build cache is cold).
//
// Options:
//   --pull / --build   Run `docker pull` to refresh the Hub image first
//   --clean-images      Remove unused old cloudflare-dev/zintrust*proxycontainer:* images before starting
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

const HUB_IMAGE = 'docker.io/zintrust/zintrust:latest';
const SHOULD_PULL = hasFlag('--pull') || hasFlag('--build');
const SHOULD_CLEAN_IMAGES = hasFlag('--clean-images');

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

const extractTagSuffix = (ref) => {
  const raw = String(ref ?? '').trim();
  const idx = raw.lastIndexOf(':');
  if (idx === -1) return '';
  return raw.slice(idx + 1).trim();
};

const findCloudflareDevSeedSource = (targetRef) => {
  const suffix = extractTagSuffix(targetRef);
  if (!suffix) return null;

  // Prefer re-tagging from an already-built Wrangler wrapper image with the same suffix.
  // This preserves EXPOSE metadata required by the Containers monitor.
  const imagesResult = runDocker(['image', 'ls', '--format', '{{.Repository}}:{{.Tag}}']);
  if (imagesResult.status !== 0) return null;

  const allRefs = splitLines(imagesResult.stdout);
  const candidates = allRefs.filter(
    (ref) =>
      /^cloudflare-dev\/zintrust.*proxycontainer:[^\s]+$/.test(String(ref ?? '')) &&
      String(ref).endsWith(`:${suffix}`)
  );

  return candidates.length > 0 ? candidates[0] : null;
};

const seedMissingTag = (targetRef) => {
  const source = findCloudflareDevSeedSource(targetRef) ?? HUB_IMAGE;
  try {
    process.stderr.write(
      `[dev:cp] docker tag ${source} ${targetRef}${source === HUB_IMAGE ? ' (from Hub)' : ''}\n`
    );
  } catch {
    // ignore
  }
  return dockerTag(source, targetRef);
};

const runDocker = (args) => {
  return spawnSync('docker', args, {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
};

const splitLines = (value) =>
  String(value ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

const cleanupOldCloudflareDevImages = () => {
  // Only remove images that are not referenced by ANY container.
  // This keeps current dev sessions safe.
  const imagesResult = runDocker(['image', 'ls', '--format', '{{.Repository}}:{{.Tag}}\t{{.ID}}']);

  if (imagesResult.status !== 0) {
    // Docker not available; skip.
    return;
  }

  const allImages = splitLines(imagesResult.stdout);
  const candidates = allImages
    .map((line) => {
      const [ref, id] = line.split('\t');
      return { ref, id };
    })
    .filter(({ ref }) =>
      /^cloudflare-dev\/zintrust.*proxycontainer:[^\s]+$/.test(String(ref ?? ''))
    );

  if (candidates.length === 0) return;

  const usedImagesResult = runDocker(['ps', '-a', '--format', '{{.Image}}']);
  const usedRefs = new Set(splitLines(usedImagesResult.stdout));

  // Note: Docker doesn't reliably expose ImageID in templates across versions,
  // so we only guard by exact ref usage. This is still safe because containers
  // typically reference the tag they were created from.
  const toRemove = candidates.filter(({ ref }) => !usedRefs.has(ref));
  if (toRemove.length === 0) return;

  try {
    process.stderr.write(
      `[dev:cp] Cleaning ${toRemove.length} unused cloudflare-dev proxy images...\n`
    );
  } catch {
    // ignore
  }

  for (const img of toRemove) {
    runDocker(['image', 'rm', '-f', img.ref]);
  }
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
      // Seed the exact tag Wrangler is looking for.
      // Prefer re-tagging from another cloudflare-dev wrapper image (same hash) so EXPOSE
      // metadata is preserved; fall back to the Hub image if needed.
      try {
        process.stderr.write(`\n[dev:cp] Seeding missing image tag: ${ref}\n`);
      } catch {
        // ignore
      }
      seedMissingTag(ref);
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

if (SHOULD_CLEAN_IMAGES) {
  cleanupOldCloudflareDevImages();
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
    const status = seedMissingTag(tag);
    if (status !== 0) {
      console.error(`[dev:cp] Failed to seed tag: ${tag} (exit ${status})`);
      process.exit(status);
    }
  }

  console.error(`[dev:cp] Retry ${attempt}/${WRANGLER_RETRIES}...\n`);
}

process.exit(1);
