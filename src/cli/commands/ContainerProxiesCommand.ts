import type { CommandOptions, IBaseCommand } from '@cli/BaseCommand';
import { BaseCommand } from '@cli/BaseCommand';
import { ContainerComposeLifecycle } from '@cli/commands/ContainerComposeLifecycle';
import { resolveComposePath } from '@cli/commands/DockerComposeCommandUtils';
import type { Command } from 'commander';

type ContainerProxiesAction = 'build' | 'up' | 'down';

type ContainerProxiesOptions = CommandOptions & {
  detach?: boolean;
  noCache?: boolean;
  pull?: boolean;
  build?: boolean;
  removeOrphans?: boolean;
  volumes?: boolean;
};

const normalizeAction = (raw?: string): ContainerProxiesAction => {
  return ContainerComposeLifecycle.normalizeAction(
    raw,
    ['build', 'up', 'down'] as const,
    'Usage: zin cp <build|up|down> [options]'
  );
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
      },
      execute: async (options: ContainerProxiesOptions): Promise<void> => {
        const action = normalizeAction(options.args?.[0]);

        const composePath = resolveComposePath(
          'docker-compose.proxy.yml',
          'docker-compose.proxy.yml not found.'
        );

        if (action === 'build') {
          await ContainerComposeLifecycle.runBuild(
            composePath,
            options,
            'Building proxy stack image...'
          );
          return;
        }

        if (action === 'down') {
          await ContainerComposeLifecycle.runDown(composePath, options, 'Stopping proxy stack...');
          return;
        }

        if (options.build === true) {
          await ContainerComposeLifecycle.runBuild(
            composePath,
            options,
            'Building proxy stack image...'
          );
        }

        await ContainerComposeLifecycle.runUp(composePath, options, 'Starting proxy stack...');
      },
    });
  },
});
