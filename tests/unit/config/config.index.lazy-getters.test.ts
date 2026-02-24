import { describe, expect, it } from 'vitest';

// Regression test for cold-start ESM cycles:
// `src/config/index.ts` must not eagerly read imported config singletons
// (e.g. middlewareConfig/queueConfig) at module initialization time.

describe('config index lazy getters (regression)', () => {
  it('imports config + middleware + queue without TDZ errors', async () => {
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
