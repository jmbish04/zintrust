import { describe, expect, it, vi } from 'vitest';

describe('Optional proxy exports (patch coverage)', () => {
  it('ZintrustD1Proxy: resolves values/functions from optional module', async () => {
    vi.resetModules();

    vi.doMock('@zintrust/cloudflare-d1-proxy', () => ({
      ZintrustD1Proxy: {
        ping: () => 'pong',
        value: 123,
      },
    }));

    const { ZintrustD1Proxy } = await import('@/proxy/d1/ZintrustD1Proxy');

    expect((ZintrustD1Proxy as any)[Symbol.toStringTag]).toBe('ZintrustD1Proxy');
    await expect((ZintrustD1Proxy as any).ping()).resolves.toBe('pong');
    await expect((ZintrustD1Proxy as any).value()).resolves.toBe(123);

    vi.doUnmock('@zintrust/cloudflare-d1-proxy');
  });

  it('ZintrustD1Proxy: throws helpful error when optional module missing', async () => {
    vi.resetModules();

    vi.doMock('@zintrust/cloudflare-d1-proxy', () => {
      throw new Error('not installed');
    });

    const { ZintrustD1Proxy } = await import('@/proxy/d1/ZintrustD1Proxy');

    await expect((ZintrustD1Proxy as any).ping()).rejects.toThrow(
      'Optional dependency not installed: @zintrust/cloudflare-d1-proxy'
    );

    vi.doUnmock('@zintrust/cloudflare-d1-proxy');
  });

  it('ZintrustD1Proxy: throws when optional module export is invalid', async () => {
    vi.resetModules();

    vi.doMock('@zintrust/cloudflare-d1-proxy', () => ({
      ZintrustD1Proxy: undefined,
      default: undefined,
    }));

    const { ZintrustD1Proxy } = await import('@/proxy/d1/ZintrustD1Proxy');

    await expect((ZintrustD1Proxy as any).ping()).rejects.toThrow(
      'Invalid module export from @zintrust/cloudflare-d1-proxy: missing ZintrustD1Proxy'
    );

    vi.doUnmock('@zintrust/cloudflare-d1-proxy');
  });

  it('ZintrustKvProxy: resolves values/functions from optional module', async () => {
    vi.resetModules();

    vi.doMock('@zintrust/cloudflare-kv-proxy', () => ({
      ZintrustKvProxy: {
        ping: () => 'pong',
        value: 456,
      },
    }));

    const { ZintrustKvProxy } = await import('@/proxy/kv/ZintrustKvProxy');

    expect((ZintrustKvProxy as any)[Symbol.toStringTag]).toBe('ZintrustKvProxy');
    await expect((ZintrustKvProxy as any).ping()).resolves.toBe('pong');
    await expect((ZintrustKvProxy as any).value()).resolves.toBe(456);

    vi.doUnmock('@zintrust/cloudflare-kv-proxy');
  });

  it('ZintrustKvProxy: throws helpful error when optional module missing', async () => {
    vi.resetModules();

    vi.doMock('@zintrust/cloudflare-kv-proxy', () => {
      throw new Error('not installed');
    });

    const { ZintrustKvProxy } = await import('@/proxy/kv/ZintrustKvProxy');

    await expect((ZintrustKvProxy as any).ping()).rejects.toThrow(
      'Optional dependency not installed: @zintrust/cloudflare-kv-proxy'
    );

    vi.doUnmock('@zintrust/cloudflare-kv-proxy');
  });

  it('ZintrustKvProxy: throws when optional module export is invalid', async () => {
    vi.resetModules();

    vi.doMock('@zintrust/cloudflare-kv-proxy', () => ({
      ZintrustKvProxy: undefined,
      default: undefined,
    }));

    const { ZintrustKvProxy } = await import('@/proxy/kv/ZintrustKvProxy');

    await expect((ZintrustKvProxy as any).ping()).rejects.toThrow(
      'Invalid module export from @zintrust/cloudflare-kv-proxy: missing ZintrustKvProxy'
    );

    vi.doUnmock('@zintrust/cloudflare-kv-proxy');
  });
});
