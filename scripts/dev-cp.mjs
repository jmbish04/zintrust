#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

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

// Wrangler builds container images for local dev using buildx and targets linux/amd64.
// On Apple Silicon, a plain `docker build` produces linux/arm64 images which cannot be
// used as the base for Wrangler's linux/amd64 build.
const REQUIRED_PLATFORM = 'linux/amd64';

const IMAGE = readFlagValue('--image') ?? 'zintrust-containers-proxy:local-amd64';
const SHOULD_BUILD = hasFlag('--build');

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (typeof result.status === 'number') process.exit(result.status);
  process.exit(1);
};

const hasDockerImage = (tag) => {
  const result = spawnSync('docker', ['image', 'inspect', tag], {
    stdio: 'ignore',
    env: process.env,
  });

  return result.status === 0;
};

const isDockerImagePlatform = (tag, requiredPlatform) => {
  const result = spawnSync(
    'docker',
    ['image', 'inspect', tag, '--format', '{{.Os}}/{{.Architecture}}'],
    {
      stdio: ['ignore', 'pipe', 'ignore'],
      env: process.env,
      encoding: 'utf8',
    }
  );

  if (result.status !== 0) return false;
  return String(result.stdout).trim() === requiredPlatform;
};

if (SHOULD_BUILD) {
  run('docker', ['buildx', 'build', '--platform', REQUIRED_PLATFORM, '--load', '-t', IMAGE, '.']);
} else if (!hasDockerImage(IMAGE) || !isDockerImagePlatform(IMAGE, REQUIRED_PLATFORM)) {
  // Wrangler requires a Dockerfile path, so our dev config uses a thin wrapper
  // Dockerfile which `FROM`s this base image. If it's missing, fail fast.
  console.error(`\n[dev:cp] Missing or wrong-platform Docker image: ${IMAGE}`);
  console.error(`[dev:cp] Required platform: ${REQUIRED_PLATFORM}`);
  console.error('[dev:cp] Build it once with: npm run dev:cp -- --build');
  console.error('');
  process.exit(1);
}

run('./bin/z.ts', ['docker', '--wrangler-config', CONFIG, '--env', ENV]);
