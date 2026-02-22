/* eslint-disable max-nested-callbacks */
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ContainerWorkersCommand publish-images (patch coverage)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('publishes both workers-api + schedules images via docker buildx', async () => {
    const spawnAndWait = vi.fn(async () => 0);
    vi.doMock('@cli/utils/spawn', () => ({ SpawnUtil: { spawnAndWait } }));
    vi.doMock('@config/logger', () => ({ Logger: { info: vi.fn(), warn: vi.fn() } }));

    const { ContainerWorkersCommand } = await import('@cli/commands/ContainerWorkersCommand');

    await ContainerWorkersCommand.create().execute({
      args: ['publish-images'],
      tag: '0.1.46',
      platforms: 'linux/amd64,linux/arm64',
    } as any);

    expect(spawnAndWait).toHaveBeenCalledTimes(1);
    expect(spawnAndWait).toHaveBeenCalledWith({
      command: 'docker',
      args: expect.arrayContaining([
        'buildx',
        'build',
        '--platform',
        'linux/amd64,linux/arm64',
        '-t',
        'zintrust/zintrust-workers:0.1.46',
        '-t',
        'zintrust/zintrust-workers:latest',
        '-t',
        'zintrust/zintrust-schedules:0.1.46',
        '-t',
        'zintrust/zintrust-schedules:latest',
        '--push',
        '.',
      ]),
    });
  });

  it('publishes only workers image via publish-workers', async () => {
    const spawnAndWait = vi.fn(async () => 0);
    vi.doMock('@cli/utils/spawn', () => ({ SpawnUtil: { spawnAndWait } }));
    vi.doMock('@config/logger', () => ({ Logger: { info: vi.fn(), warn: vi.fn() } }));

    const { ContainerWorkersCommand } = await import('@cli/commands/ContainerWorkersCommand');

    await ContainerWorkersCommand.create().execute({
      args: ['publish-workers'],
      tag: '0.1.46',
      platforms: 'linux/amd64',
      alsoLatest: false,
    } as any);

    expect(spawnAndWait).toHaveBeenCalledTimes(1);
    expect(spawnAndWait).toHaveBeenCalledWith({
      command: 'docker',
      args: expect.arrayContaining([
        'buildx',
        'build',
        '--platform',
        'linux/amd64',
        '-t',
        'zintrust/zintrust-workers:0.1.46',
        '--push',
        '.',
      ]),
    });

    const argList = (spawnAndWait.mock.calls[0]?.[0] as any)?.args as string[];
    expect(argList.join(' ')).not.toContain('zintrust/zintrust-schedules');
    expect(argList.join(' ')).not.toContain(':latest');
  });

  it('defaults to current version tag + latest when --tag is omitted (publish-schedules-only)', async () => {
    const spawnAndWait = vi.fn(async () => 0);
    vi.doMock('@cli/utils/spawn', () => ({ SpawnUtil: { spawnAndWait } }));
    vi.doMock('@config/logger', () => ({ Logger: { info: vi.fn(), warn: vi.fn() } }));
    vi.doMock('@cli/services/VersionChecker', () => ({
      VersionChecker: {
        getCurrentVersion: () => '9.9.9',
      },
    }));

    const { ContainerWorkersCommand } = await import('@cli/commands/ContainerWorkersCommand');

    await ContainerWorkersCommand.create().execute({
      args: ['publish-schedules-only'],
      platforms: 'linux/amd64',
    } as any);

    expect(spawnAndWait).toHaveBeenCalledTimes(1);
    expect(spawnAndWait).toHaveBeenCalledWith({
      command: 'docker',
      args: expect.arrayContaining([
        'buildx',
        'build',
        '--platform',
        'linux/amd64',
        '-t',
        'zintrust/zintrust-schedules:9.9.9',
        '-t',
        'zintrust/zintrust-schedules:latest',
        '--push',
        '.',
      ]),
    });

    const argList = (spawnAndWait.mock.calls[0]?.[0] as any)?.args as string[];
    expect(argList.join(' ')).not.toContain('zintrust/zintrust-workers');
  });
});
