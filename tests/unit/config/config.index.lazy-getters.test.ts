import { afterEach, describe, expect, it, vi } from 'vitest';

const MOCKED_CONFIG_MODULES = [
  '@config/app',
  '@config/broadcast',
  '@config/cache',
  '@config/database',
  '@config/microservices',
  '@config/middleware',
  '@config/notification',
  '@config/queue',
  '@config/security',
  '@config/storage',
] as const;

afterEach(() => {
  // IMPORTANT:
  // `vi.doMock()` persists until explicitly un-mocked, even if we reset the module cache.
  // These tests mix mocked coverage runs with real-module regression checks.
  for (const mod of MOCKED_CONFIG_MODULES) {
    vi.doUnmock(mod);
  }
  vi.clearAllMocks();
  vi.resetModules();
});

// Regression test for cold-start ESM cycles:
// `src/config/index.ts` must not eagerly read imported config singletons
// (e.g. middlewareConfig/queueConfig) at module initialization time.

describe('config index lazy getters (regression)', () => {
  it('executes every config getter (coverage)', async () => {
    vi.resetModules();

    vi.doMock('@config/app', () => ({ appConfig: { __name: 'app' } }));
    vi.doMock('@config/broadcast', () => ({
      default: { __name: 'broadcast' },
      broadcastConfig: { __name: 'broadcast' },
    }));
    vi.doMock('@config/cache', () => ({ cacheConfig: { __name: 'cache' } }));
    vi.doMock('@config/database', () => ({ databaseConfig: { __name: 'database' } }));
    vi.doMock('@config/microservices', () => ({
      microservicesConfig: { __name: 'microservices' },
    }));
    vi.doMock('@config/middleware', () => ({ middlewareConfig: { __name: 'middleware' } }));
    vi.doMock('@config/notification', () => ({
      default: { __name: 'notification' },
      notificationConfig: { __name: 'notification' },
    }));
    vi.doMock('@config/queue', () => ({ queueConfig: { __name: 'queue' } }));
    vi.doMock('@config/security', () => ({ securityConfig: { __name: 'security' } }));
    vi.doMock('@config/storage', () => ({ storageConfig: { __name: 'storage' } }));

    const cfg = await import('@/config');

    expect(cfg.config.app).toEqual({ __name: 'app' });
    expect(cfg.config.broadcast).toEqual({ __name: 'broadcast' });
    expect(cfg.config.cache).toEqual({ __name: 'cache' });
    expect(cfg.config.database).toEqual({ __name: 'database' });
    expect(cfg.config.microservices).toEqual({ __name: 'microservices' });
    expect(cfg.config.middleware).toEqual({ __name: 'middleware' });
    expect(cfg.config.notification).toEqual({ __name: 'notification' });
    expect(cfg.config.queue).toEqual({ __name: 'queue' });
    expect(cfg.config.security).toEqual({ __name: 'security' });
    expect(cfg.config.storage).toEqual({ __name: 'storage' });
  });

  it('imports config + middleware + queue without TDZ errors', async () => {
    vi.resetModules();

    // Import order that previously triggered TDZ errors in cold-start scenarios.
    const cfg = await import('@/config');
    const mw = await import('@/config/middleware');
    const q = await import('@/config/queue');

    expect(cfg.config).toBeDefined();
    expect(mw.middlewareConfig).toBeDefined();
    expect(q.queueConfig).toBeDefined();

    // Access the lazy getter to ensure it resolves at runtime.
    expect(cfg.config.middleware.global.length).toBeGreaterThan(0);
  });

  it('imports in parallel without TDZ errors', async () => {
    vi.resetModules();

    const [cfg, mw, q] = await Promise.all([
      import('@/config'),
      import('@/config/middleware'),
      import('@/config/queue'),
    ]);

    expect(cfg.config.middleware.global.length).toBeGreaterThan(0);
    expect(Object.keys(mw.middlewareConfig.route).length).toBeGreaterThan(0);
    expect(typeof q.queueConfig.default).toBe('string');
  });
});
