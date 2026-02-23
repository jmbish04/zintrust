import { describe, expect, it, vi } from 'vitest';

describe('patch coverage: tools/http/HttpClient raw+stream', () => {
  it('sendRaw() and sendStream() return Response and stream', async () => {
    vi.resetModules();

    const fetchSpy = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy as any);

    vi.doMock('@config/env', () => ({
      Env: {
        getInt: (_k: string, fallback: number) => fallback,
      },
    }));

    vi.doMock('@/observability/OpenTelemetry', () => ({
      OpenTelemetry: {
        isEnabled: () => false,
        injectTraceHeaders: () => undefined,
      },
    }));

    vi.doMock('@config/logger', () => ({
      Logger: {
        debug: vi.fn(),
      },
    }));

    const { HttpClient } = await import('@httpClient/Http');

    const raw = await HttpClient.get('https://example.test').sendRaw();
    expect(raw.status).toBe(200);

    const streamed = await HttpClient.get('https://example.test').sendStream();
    expect(streamed.response.status).toBe(200);
    expect(streamed.stream).not.toBeNull();

    expect(fetchSpy).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
