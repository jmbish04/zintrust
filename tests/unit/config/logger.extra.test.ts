import { beforeEach, describe, expect, it, vi } from 'vitest';

let kvSpy: ReturnType<typeof vi.fn>;
let slackSpy: ReturnType<typeof vi.fn>;
let httpSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  delete process.env.NODE_ENV;
  delete process.env['LOG_FORMAT'];

  // Recreate spies for each test so the mocked modules can reference them
  kvSpy = vi.fn();
  slackSpy = vi.fn();
  httpSpy = vi.fn();

  // Expose to global so hoisted mock factories can call them at runtime
  (globalThis as any).__kvSpy = kvSpy;
  (globalThis as any).__slackSpy = slackSpy;
  (globalThis as any).__httpSpy = httpSpy;
});

describe('Logger additional branches', () => {
  it('handles Env.get non-string and null values via fallback/string conversion', async () => {
    const logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => undefined);

    vi.resetModules();
    vi.doMock('@config/env', () => ({
      Env: {
        LOG_LEVEL: 'debug',
        get: (key: string, fallback?: string) => (key === 'LOG_FORMAT' ? 123 : fallback),
        getBool: (_key: string, fallback?: boolean) => Boolean(fallback),
      },
    }));

    const { Logger } = await import('@config/logger');
    Logger.info('coerce non-string LOG_FORMAT');

    vi.resetModules();
    vi.doMock('@config/env', () => ({
      Env: {
        LOG_LEVEL: 'debug',
        get: (_key: string, _fallback?: string) => null,
        getBool: (_key: string, fallback?: boolean) => Boolean(fallback),
      },
    }));

    const { Logger: LoggerNull } = await import('@config/logger');
    LoggerNull.info('fallback when Env.get returns null');

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
    vi.doUnmock('@config/env');
  });

  it('falls back when Env.getBool throws', async () => {
    vi.resetModules();
    const logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => undefined);

    vi.doMock('@config/env', () => ({
      Env: {
        LOG_LEVEL: 'debug',
        get: (_key: string, fallback?: string) => fallback ?? 'text',
        getBool: (key: string, fallback?: boolean) => {
          if (key === 'DISABLE_LOGGING') {
            throw new Error('boom');
          }
          return Boolean(fallback);
        },
      },
    }));

    const { Logger } = await import('@config/logger');
    Logger.info('getBool throw fallback');

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
    vi.doUnmock('@config/env');
  });

  it('debug logs only in development', async () => {
    process.env.NODE_ENV = 'development';

    const debugSpy = vi.spyOn(globalThis.console, 'debug').mockImplementation(() => undefined);

    const { Logger } = await import('@config/logger');

    Logger.debug('dbg-msg', { a: 1 });

    expect(debugSpy).toHaveBeenCalled();

    debugSpy.mockRestore();
  });

  it('emitCloudLogs enqueues to Kv/Slack/Http based on level', async () => {
    // Mocks reference module-scoped spies (recreated in beforeEach)

    // Use global hooks so hoisted mock factories can reference live spies
    vi.mock('@config/logging/KvLogger', () => ({
      KvLogger: { enqueue: (...args: unknown[]) => (globalThis as any).__kvSpy?.(...args) },
    }));
    vi.mock('@config/logging/SlackLogger', () => ({
      SlackLogger: { enqueue: (...args: unknown[]) => (globalThis as any).__slackSpy?.(...args) },
    }));
    vi.mock('@config/logging/HttpLogger', () => ({
      HttpLogger: { enqueue: (...args: unknown[]) => (globalThis as any).__httpSpy?.(...args) },
    }));

    // Preload mocked modules so dynamic imports resolve immediately
    await import('@config/logging/KvLogger');
    await import('@config/logging/SlackLogger');
    await import('@config/logging/HttpLogger');

    const { Logger } = await import('@config/logger');

    Logger.error('err-level', new Error('boom'));

    // allow dynamic imports to settle
    await new Promise((r) => setTimeout(r, 50));

    expect(kvSpy).toHaveBeenCalled();
    expect(slackSpy).toHaveBeenCalled();
    expect(httpSpy).toHaveBeenCalled();

    // Reset modules and recreate spies to ensure a fresh state for the second phase
    vi.resetModules();
    kvSpy = vi.fn();
    slackSpy = vi.fn();
    httpSpy = vi.fn();

    (globalThis as any).__kvSpy = kvSpy;
    (globalThis as any).__slackSpy = slackSpy;
    (globalThis as any).__httpSpy = httpSpy;

    // Now test warn level: should call Slack and Http but not KV
    // Use global hooks so hoisted mock factories can reference live spies
    vi.mock('@config/logging/KvLogger', () => ({
      KvLogger: { enqueue: (...args: unknown[]) => (globalThis as any).__kvSpy?.(...args) },
    }));
    vi.mock('@config/logging/SlackLogger', () => ({
      SlackLogger: { enqueue: (...args: unknown[]) => (globalThis as any).__slackSpy?.(...args) },
    }));
    vi.mock('@config/logging/HttpLogger', () => ({
      HttpLogger: { enqueue: (...args: unknown[]) => (globalThis as any).__httpSpy?.(...args) },
    }));

    const { Logger: Logger2 } = await import('@config/logger');

    Logger2.warn('warn-level');

    // allow dynamic imports to settle
    await new Promise((r) => setTimeout(r, 50));

    expect(kvSpy).not.toHaveBeenCalled();
    expect(slackSpy).toHaveBeenCalled();
    expect(httpSpy).toHaveBeenCalled();
  });
});
