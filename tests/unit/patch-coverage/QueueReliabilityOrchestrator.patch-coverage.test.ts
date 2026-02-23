import { describe, expect, it, vi } from 'vitest';

describe('patch coverage: tools/queue/QueueReliabilityOrchestrator', () => {
  it('start() creates unrefable intervals and stop() clears them', async () => {
    vi.resetModules();

    const unref = vi.fn();
    const fakeTimer = { unref };

    const setIntervalSpy = vi.fn((_fn: () => void, _ms?: number) => fakeTimer as any);
    const clearIntervalSpy = vi.fn();

    vi.stubGlobal('setInterval', setIntervalSpy as any);
    vi.stubGlobal('clearInterval', clearIntervalSpy as any);

    vi.doMock('@config/env', () => ({
      Env: {
        getBool: () => true,
        getInt: (_k: string, fallback: number) => fallback,
      },
    }));

    vi.doMock('@config/logger', () => ({
      Logger: {
        info: vi.fn(),
        warn: vi.fn(),
      },
    }));

    vi.doMock('@queue/JobReconciliationRunner', () => ({
      JobReconciliationRunner: { runOnce: vi.fn(async () => undefined) },
    }));

    vi.doMock('@queue/JobRecoveryDaemon', () => ({
      JobRecoveryDaemon: { runOnce: vi.fn(async () => undefined) },
    }));

    vi.doMock('@queue/StalledJobMonitor', () => ({
      StalledJobMonitor: { scanOnce: vi.fn(async () => undefined) },
    }));

    const { QueueReliabilityOrchestrator } = await import('@queue/QueueReliabilityOrchestrator');

    QueueReliabilityOrchestrator.start();

    expect(setIntervalSpy).toHaveBeenCalledTimes(3);
    expect(unref).toHaveBeenCalledTimes(3);

    QueueReliabilityOrchestrator.stop();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(3);

    vi.unstubAllGlobals();
  });
});
