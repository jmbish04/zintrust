import type { CommandOptions, IBaseCommand } from '@cli/BaseCommand';
import { BaseCommand } from '@cli/BaseCommand';
import {
  resolveComposePath,
  runComposeWithFallback,
} from '@cli/commands/DockerComposeCommandUtils';
import { VersionChecker } from '@cli/services/VersionChecker';
import { SpawnUtil } from '@cli/utils/spawn';
import { Logger } from '@config/logger';
import { ErrorFactory } from '@exceptions/ZintrustError';
import type { Command } from 'commander';

type ContainerWorkersAction =
  | 'build'
  | 'up'
  | 'publish-images'
  | 'publish-workers'
  | 'publish-schedules';

type ContainerWorkersOptions = CommandOptions & {
  detach?: boolean;
  noCache?: boolean;
  pull?: boolean;
  build?: boolean;
  tag?: string;
  platforms?: string;
  alsoLatest?: boolean;
};

const parsePlatforms = (value: string | undefined): string => {
  const raw = (value ?? '').trim();
  if (raw !== '') return raw;
  return 'linux/amd64,linux/arm64';
};

const parseTag = (value: string | undefined): string => {
  const raw = (value ?? '').trim();
  if (raw === '') {
    const currentVersion = VersionChecker.getCurrentVersion();
    return currentVersion === '0.0.0' ? 'latest' : currentVersion;
  }
  return raw;
};

const resolvePublishTags = (tag: string, alsoLatest: boolean | undefined): string[] => {
  if (tag === 'latest') return ['latest'];
  if (alsoLatest === false) return [tag];
  return [tag, 'latest'];
};

type PublishTarget = 'workers' | 'schedules' | 'both';

const resolveTargetFromAction = (action: ContainerWorkersAction): PublishTarget => {
  if (action === 'publish-workers') return 'workers';
  if (action === 'publish-schedules') return 'schedules';
  return 'both';
};

const runPublishImages = async (
  options: ContainerWorkersOptions,
  target: PublishTarget
): Promise<void> => {
  const tag = parseTag(options.tag);
  const platforms = parsePlatforms(options.platforms);
  const tags = resolvePublishTags(tag, options.alsoLatest);

  const workersRepo = 'zintrust/zintrust-workers';
  const schedulesRepo = 'zintrust/zintrust-schedules';

  const buildArgs: string[] = ['buildx', 'build', '--platform', platforms];

  if (target === 'workers' || target === 'both') {
    for (const t of tags) buildArgs.push('-t', `${workersRepo}:${t}`);
  }

  if (target === 'schedules' || target === 'both') {
    for (const t of tags) buildArgs.push('-t', `${schedulesRepo}:${t}`);
  }

  buildArgs.push('--push', '.');

  Logger.info('Publishing workers/schedules images to Docker Hub via buildx...', {
    workers: target === 'workers' || target === 'both' ? workersRepo : undefined,
    schedules: target === 'schedules' || target === 'both' ? schedulesRepo : undefined,
    platforms,
    tags,
  });

  const exitCode = await SpawnUtil.spawnAndWait({ command: 'docker', args: buildArgs });
  if (exitCode !== 0) {
    throw ErrorFactory.createCliError(`Failed to publish images (exit code ${exitCode})`);
  }
};

const runBuild = async (composePath: string, options: ContainerWorkersOptions): Promise<void> => {
  const args = ['compose', '-f', composePath, 'build'];

  if (options.noCache === true) {
    args.push('--no-cache');
  }

  if (options.pull === true) {
    args.push('--pull');
  }

  Logger.info('Building container workers image...');
  await runComposeWithFallback(args);
};

const runUp = async (composePath: string, options: ContainerWorkersOptions): Promise<void> => {
  const args = ['compose', '-f', composePath, 'up'];

  if (options.detach === true) {
    args.push('-d');
  }

  Logger.info('Starting container workers...');
  await runComposeWithFallback(args);
};

const normalizeAction = (raw?: string): ContainerWorkersAction => {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'build' || value === 'up') return value;
  if (value === 'publish-images') return value;
  if (
    value === 'publish-workers' ||
    value === 'publish-worker' ||
    value === 'publish-workers-only' ||
    value === 'publish-worker-only'
  ) {
    return 'publish-workers';
  }
  if (
    value === 'publish-schedules' ||
    value === 'publish-schedule' ||
    value === 'publish-schedules-only' ||
    value === 'publish-schedule-only'
  ) {
    return 'publish-schedules';
  }
  throw ErrorFactory.createCliError(
    'Usage: zin cw <build|up|publish-images|publish-workers|publish-schedules> [options]'
  );
};

export const ContainerWorkersCommand = Object.freeze({
  create(): IBaseCommand {
    return BaseCommand.create({
      name: 'cw',
      aliases: ['container-workers'],
      description: 'Build or start container-based workers',
      addOptions: (command: Command): void => {
        command.argument(
          '<action>',
          'Action to run (build, up, publish-images, publish-workers, publish-schedules)'
        );
        command.option('-d, --detach', 'Run containers in background (up only)');
        command.option('--no-cache', 'Disable Docker build cache (build only)');
        command.option('--pull', 'Always attempt to pull a newer base image (build only)');
        command.option('--build', 'Build before running up (up only)');

        command.option(
          '--tag <tag>',
          'Docker image tag to publish (publish-* only). Defaults to current version and also tags :latest'
        );
        command.option(
          '--platforms <list>',
          'Comma-separated platforms for buildx (publish-* only)',
          'linux/amd64,linux/arm64'
        );
        command.option(
          '--no-also-latest',
          'When publishing a non-latest --tag, do not also push :latest'
        );
      },
      execute: async (options: ContainerWorkersOptions): Promise<void> => {
        const action = normalizeAction(options.args?.[0]);

        if (
          action === 'publish-images' ||
          action === 'publish-workers' ||
          action === 'publish-schedules'
        ) {
          await runPublishImages(options, resolveTargetFromAction(action));
          return;
        }

        const composePath = resolveComposePath(
          'docker-compose.workers.yml',
          'docker-compose.workers.yml not found. Run `zin init:cw` first.'
        );

        if (action === 'build') {
          await runBuild(composePath, options);
          return;
        }

        if (options.build === true) {
          await runBuild(composePath, options);
        }

        await runUp(composePath, options);
      },
    });
  },
});
