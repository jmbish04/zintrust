import type { CommandOptions, IBaseCommand } from '@cli/BaseCommand';
import { BaseCommand } from '@cli/BaseCommand';
import { ContainerComposeLifecycle } from '@cli/commands/ContainerComposeLifecycle';
import { resolveComposePath } from '@cli/commands/DockerComposeCommandUtils';
import type { Command } from 'commander';

type ContainerWorkersAction = 'build' | 'up';

type ContainerWorkersOptions = CommandOptions & {
  detach?: boolean;
  noCache?: boolean;
  pull?: boolean;
  build?: boolean;
};

const normalizeAction = (raw?: string): ContainerWorkersAction => {
  return ContainerComposeLifecycle.normalizeAction(
    raw,
    ['build', 'up'] as const,
    'Usage: zin cw <build|up> [options]'
  );
};

export const ContainerWorkersCommand = Object.freeze({
  create(): IBaseCommand {
    return BaseCommand.create({
      name: 'cw',
      aliases: ['container-workers'],
      description: 'Build or start container-based workers',
      addOptions: (command: Command): void => {
        command.argument('<action>', 'Action to run (build, up)');
        command.option('-d, --detach', 'Run containers in background (up only)');
        command.option('--no-cache', 'Disable Docker build cache (build only)');
        command.option('--pull', 'Always attempt to pull a newer base image (build only)');
        command.option('--build', 'Build before running up (up only)');
      },
      execute: async (options: ContainerWorkersOptions): Promise<void> => {
        const action = normalizeAction(options.args?.[0]);

        const composePath = resolveComposePath(
          'docker-compose.workers.yml',
          'docker-compose.workers.yml not found. Run `zin init:cw` first.'
        );

        if (action === 'build') {
          await ContainerComposeLifecycle.runBuild(
            composePath,
            options,
            'Building container workers image...'
          );
          return;
        }

        if (options.build === true) {
          await ContainerComposeLifecycle.runBuild(
            composePath,
            options,
            'Building container workers image...'
          );
        }

        await ContainerComposeLifecycle.runUp(
          composePath,
          options,
          'Starting container workers...'
        );
      },
    });
  },
});
