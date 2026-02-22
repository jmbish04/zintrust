import { runComposeWithFallback } from '@cli/commands/DockerComposeCommandUtils';
import { Logger } from '@config/logger';
import { ErrorFactory } from '@exceptions/ZintrustError';

type ComposeBuildOptions = {
  noCache?: boolean;
  pull?: boolean;
};

type ComposeUpOptions = {
  detach?: boolean;
  removeOrphans?: boolean;
};

type ComposeDownOptions = {
  volumes?: boolean;
  removeOrphans?: boolean;
};

export const ContainerComposeLifecycle = Object.freeze({
  normalizeAction<const Allowed extends readonly string[]>(
    raw: string | undefined,
    allowed: Allowed,
    usageMessage: string
  ): Allowed[number] {
    const value = (raw ?? '').trim().toLowerCase();
    for (const item of allowed) {
      if (value === item) return item;
    }
    throw ErrorFactory.createCliError(usageMessage);
  },

  async runBuild(
    composePath: string,
    options: ComposeBuildOptions,
    logMessage: string
  ): Promise<void> {
    const args = ['compose', '-f', composePath, 'build'];

    if (options.noCache === true) {
      args.push('--no-cache');
    }

    if (options.pull === true) {
      args.push('--pull');
    }

    Logger.info(logMessage);
    await runComposeWithFallback(args);
  },

  async runUp(composePath: string, options: ComposeUpOptions, logMessage: string): Promise<void> {
    const args = ['compose', '-f', composePath, 'up'];

    if (options.detach === true) {
      args.push('-d');
    }

    if (options.removeOrphans === true) {
      args.push('--remove-orphans');
    }

    Logger.info(logMessage);
    await runComposeWithFallback(args);
  },

  async runDown(
    composePath: string,
    options: ComposeDownOptions,
    logMessage: string
  ): Promise<void> {
    const args = ['compose', '-f', composePath, 'down'];

    if (options.volumes === true) {
      args.push('-v');
    }

    if (options.removeOrphans === true) {
      args.push('--remove-orphans');
    }

    Logger.info(logMessage);
    await runComposeWithFallback(args);
  },
});
