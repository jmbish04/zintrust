import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMockRedis = () => {
  const store = new Map<string, string>();
  const redis = {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (...keys: string[]) => {
      for (const key of keys) store.delete(key);
      return keys.length;
    }),
    incr: vi.fn(async (key: string) => {
      const current = Number(store.get(key) ?? '0');
      const next = Number.isFinite(current) ? current + 1 : 1;
      store.set(key, String(next));
      return next;
    }),
    scanStream: vi.fn((_opts?: { match?: string; count?: number }) => {
      return {
        on: (event: string, cb: (arg?: string[] | Error) => void) => {
          if (event === 'data') cb(['csrf:1:s1', 'csrf:1:s2']);
          if (event === 'end') cb();
          return undefined;
        },
      };
    }),
  };

  return {
    redis,
    getStored: (key: string) => store.get(key) ?? null,
    setStored: (key: string, payload: string | null) => {
      if (payload === null) {
        store.delete(key);
        return;
      }
      store.set(key, payload);
    },
  };
};

describe('CsrfTokenManager (redis)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('generates, validates, refreshes, and invalidates tokens via redis', async () => {
    const { redis, getStored } = createMockRedis();
    const createRedisConnection = vi.fn(() => redis);

    vi.doMock('@config/workers', () => ({
      createRedisConnection,
    }));
    vi.doMock('@config/logger', () => ({
      Logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      },
    }));

    const { CsrfTokenManager } = await import('@security/CsrfTokenManager');

    const manager = CsrfTokenManager.create({
      store: 'redis',
      keyPrefix: 'csrf:',
      tokenLength: 4,
      tokenTtlMs: 10_000,
    });

    const token = await manager.generateToken('session-1');
    expect(token).toBeDefined();
    expect(createRedisConnection).toHaveBeenCalledTimes(1);

    const isValid = await manager.validateToken('session-1', token);
    expect(isValid).toBe(true);

    const refreshed = await manager.refreshToken('session-1');
    expect(refreshed).toBe(token);
    expect(redis.set).toHaveBeenCalled();

    const storedBefore = getStored('csrf:1:session-1');
    expect(storedBefore).toBeTypeOf('string');

    await manager.invalidateToken('session-1');
    expect(redis.del).toHaveBeenCalledWith('csrf:1:session-1');

    const storedAfter = getStored('csrf:1:session-1');
    expect(storedAfter).toBeNull();
  });

  it('returns false and deletes expired tokens', async () => {
    const { redis, setStored } = createMockRedis();
    const createRedisConnection = vi.fn(() => redis);

    vi.doMock('@config/workers', () => ({
      createRedisConnection,
    }));
    vi.doMock('@config/logger', () => ({
      Logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      },
    }));

    const { CsrfTokenManager } = await import('@security/CsrfTokenManager');

    const expired = {
      token: 'expired-token',
      sessionId: 'session-expired',
      createdAt: Date.now() - 20_000,
      expiresAt: Date.now() - 10_000,
    };
    setStored('csrf:1:session-expired', JSON.stringify(expired));

    const manager = CsrfTokenManager.create({
      store: 'redis',
      keyPrefix: 'csrf:',
      tokenLength: 4,
      tokenTtlMs: 1_000,
    });

    const isValid = await manager.validateToken('session-expired', 'expired-token');
    expect(isValid).toBe(false);
    expect(redis.del).toHaveBeenCalledWith('csrf:1:session-expired');
  });

  it('returns null for missing or expired refresh and supports clear/count', async () => {
    const { redis, setStored } = createMockRedis();
    const createRedisConnection = vi.fn(() => redis);

    vi.doMock('@config/workers', () => ({
      createRedisConnection,
    }));
    vi.doMock('@config/logger', () => ({
      Logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      },
    }));

    const { CsrfTokenManager } = await import('@security/CsrfTokenManager');

    const manager = CsrfTokenManager.create({
      store: 'redis',
      keyPrefix: 'csrf:',
      tokenLength: 4,
      tokenTtlMs: 1_000,
    });

    setStored('csrf:1:missing', null);
    expect(await manager.refreshToken('missing')).toBeNull();

    const expired = {
      token: 'old-token',
      sessionId: 'old-session',
      createdAt: Date.now() - 20_000,
      expiresAt: Date.now() - 10_000,
    };
    setStored('csrf:1:old-session', JSON.stringify(expired));

    expect(await manager.refreshToken('old-session')).toBeNull();
    expect(redis.del).toHaveBeenCalledWith('csrf:1:old-session');

    expect(await manager.getTokenCount()).toBe(2);
    await manager.clear();
    expect(redis.incr).toHaveBeenCalledWith('csrf:__v');

    expect(await manager.cleanup()).toBe(0);
  });
});
