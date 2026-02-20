import type { CommandOptions, IBaseCommand } from '@cli/BaseCommand';
import { BaseCommand } from '@cli/BaseCommand';
import {
  resolveComposePath,
  runComposeWithFallback,
} from '@cli/commands/DockerComposeCommandUtils';
import { SpawnUtil } from '@cli/utils/spawn';
import { Logger } from '@config/logger';
import { ErrorFactory } from '@exceptions/ZintrustError';
import type { Command } from 'commander';

type ContainerProxiesAction = 'build' | 'up' | 'down' | 'publish-images';

type ContainerProxiesOptions = CommandOptions & {
  detach?: boolean;
  noCache?: boolean;
  pull?: boolean;
  build?: boolean;
  removeOrphans?: boolean;
  volumes?: boolean;
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
  if (raw === '') return 'latest';
  return raw;
};

const resolvePublishTags = (tag: string, alsoLatest: boolean | undefined): string[] => {
  if (tag === 'latest') return ['latest'];
  if (alsoLatest === false) return [tag];
  return [tag, 'latest'];
};

const runPublishImages = async (options: ContainerProxiesOptions): Promise<void> => {
  const tag = parseTag(options.tag);
  const platforms = parsePlatforms(options.platforms);
  const tags = resolvePublishTags(tag, options.alsoLatest);

  const runtimeRepo = 'zintrust/zintrust-proxy';
  const gatewayRepo = 'zintrust/zintrust-proxy-gateway';

  const buildArgsFor = (repo: string, context: string): string[] => {
    const args: string[] = ['buildx', 'build', '--platform', platforms];
    for (const t of tags) args.push('-t', `${repo}:${t}`);
    args.push('--push', context);
    return args;
  };

  Logger.info('Publishing proxy images to Docker Hub via buildx...', {
    runtime: runtimeRepo,
    gateway: gatewayRepo,
    platforms,
    tags,
  });

  const runtimeExit = await SpawnUtil.spawnAndWait({
    command: 'docker',
    args: buildArgsFor(runtimeRepo, '.'),
    env: process.env,
  });
  if (runtimeExit !== 0) {
    throw ErrorFactory.createCliError(
      `Failed to publish ${runtimeRepo} (exit code ${runtimeExit})`
    );
  }

  const gatewayExit = await SpawnUtil.spawnAndWait({
    command: 'docker',
    args: buildArgsFor(gatewayRepo, './docker/proxy-gateway'),
    env: process.env,
  });
  if (gatewayExit !== 0) {
    throw ErrorFactory.createCliError(
      `Failed to publish ${gatewayRepo} (exit code ${gatewayExit})`
    );
  }
};

const runBuild = async (composePath: string, options: ContainerProxiesOptions): Promise<void> => {
  const args = ['compose', '-f', composePath, 'build'];

  if (options.noCache === true) {
    args.push('--no-cache');
  }

  if (options.pull === true) {
    args.push('--pull');
  }

  Logger.info('Building proxy stack image...');
  await runComposeWithFallback(args);
};

const runUp = async (composePath: string, options: ContainerProxiesOptions): Promise<void> => {
  const args = ['compose', '-f', composePath, 'up'];

  if (options.detach === true) {
    args.push('-d');
  }

  if (options.removeOrphans === true) {
    args.push('--remove-orphans');
  }

  Logger.info('Starting proxy stack...');
  await runComposeWithFallback(args);
};

const runDown = async (composePath: string, options: ContainerProxiesOptions): Promise<void> => {
  const args = ['compose', '-f', composePath, 'down'];

  if (options.removeOrphans === true) {
    args.push('--remove-orphans');
  }

  if (options.volumes === true) {
    args.push('--volumes');
  }

  Logger.info('Stopping proxy stack...');
  await runComposeWithFallback(args);
};

const normalizeAction = (raw?: string): ContainerProxiesAction => {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'build' || value === 'up' || value === 'down') return value;
  if (value === 'publish-images') return value;
  throw ErrorFactory.createCliError('Usage: zin cp <build|up|down|publish-images> [options]');
};

export const ContainerProxiesCommand = Object.freeze({
  create(): IBaseCommand {
    return BaseCommand.create({
      name: 'cp',
      aliases: ['container-proxies'],
      description: 'Build, start, or stop container-based proxy stack',
      addOptions: (command: Command): void => {
        command.argument('<action>', 'Action to run (build, up, down)');
        command.option('-d, --detach', 'Run containers in background (up only)');
        command.option('--no-cache', 'Disable Docker build cache (build only)');
        command.option('--pull', 'Always attempt to pull a newer base image (build only)');
        command.option('--build', 'Build before running up (up only)');
        command.option('--remove-orphans', 'Remove containers for services not defined in compose');
        command.option('--volumes', 'Remove named volumes when running down (down only)');

        command.option(
          '--tag <tag>',
          'Docker image tag to publish (publish-images only)',
          'latest'
        );
        command.option(
          '--platforms <list>',
          'Comma-separated platforms for buildx (publish-images only)',
          'linux/amd64,linux/arm64'
        );
        command.option(
          '--no-also-latest',
          'When publishing a non-latest --tag, do not also push :latest'
        );
      },
      execute: async (options: ContainerProxiesOptions): Promise<void> => {
        const action = normalizeAction(options.args?.[0]);
        if (action === 'publish-images') {
          await runPublishImages(options);
          return;
        }

        const composePath = resolveComposePath(
          'docker-compose.proxy.yml',
          'docker-compose.proxy.yml not found.'
        );

        if (action === 'build') {
          await runBuild(composePath, options);
          return;
        }

        if (action === 'down') {
          await runDown(composePath, options);
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
