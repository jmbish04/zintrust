import type { IRequest } from '@http/Request';
import type { IResponse } from '@http/Response';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@config/security', () => ({
  securityConfig: {
    jwt: {
      algorithm: 'HS256',
      secret: 'secret',
    },
  },
}));

vi.mock('@config/env', () => ({
  Env: {
    get: vi.fn(() => ''),
  },
}));

vi.mock('@security/TokenRevocation', () => ({
  TokenRevocation: {
    isRevoked: vi.fn(() => false),
  },
}));

vi.mock('@security/SignedRequest', () => ({
  SignedRequest: {
    verify: vi.fn(async () => ({ ok: true, keyId: 'dev-1', timestampMs: Date.now(), nonce: 'n1' })),
    sha256Hex: vi.fn(async () => 'uah'),
  },
}));

vi.mock('@security/JwtManager', () => ({
  JwtManager: {
    create: vi.fn(() => ({
      setHmacSecret: vi.fn(),
      verify: vi.fn(() => ({ sub: '1', deviceId: 'dev-1' })),
    })),
  },
}));

vi.mock('@/config/logger', () => ({
  Logger: {
    debug: vi.fn(),
  },
}));

import { BulletproofAuthMiddleware } from '@middleware/BulletproofAuthMiddleware';
import { JwtAuthMiddleware } from '@middleware/JwtAuthMiddleware';
import { SignedRequest } from '@security/SignedRequest';
import { TokenRevocation } from '@security/TokenRevocation';

const createReqRes = (headers: Record<string, string>): { req: IRequest; res: IResponse } => {
  const res: any = {
    statusCode: 200,
    body: undefined as unknown,
    setStatus(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return undefined;
    },
  };

  const req: any = {
    user: undefined,
    context: {},
    getMethod() {
      return 'GET';
    },
    getPath() {
      return '/me';
    },
    getRaw() {
      return { url: '/me?x=1' };
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
  };

  return { req, res };
};

describe('patch coverage: BulletproofAuthMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when token is revoked', async () => {
    (TokenRevocation.isRevoked as any).mockImplementationOnce(() => true);

    const middleware = BulletproofAuthMiddleware.create({ signingSecret: 's' });
    const { req, res } = createReqRes({
      authorization: 'Bearer token',
      'x-zt-key-id': 'dev-1',
      'x-zt-device-id': 'dev-1',
      'x-zt-timestamp': String(Date.now()),
      'x-zt-nonce': 'n1',
      'x-zt-body-sha256': 'b',
      'x-zt-signature': 'sig',
    });

    await middleware(req, res, async () => undefined);

    expect((res as any).statusCode).toBe(401);
    expect((res as any).body).toEqual({ error: 'Invalid or expired token' });
  });

  it('attaches req.user and auth context on success', async () => {
    const middleware = BulletproofAuthMiddleware.create({ signingSecret: 's' });
    const { req, res } = createReqRes({
      authorization: 'Bearer token',
      'x-zt-key-id': 'dev-1',
      'x-zt-device-id': 'dev-1',
      'x-zt-timestamp': String(Date.now()),
      'x-zt-nonce': 'n1',
      'x-zt-body-sha256': 'b',
      'x-zt-signature': 'sig',
      'user-agent': 'ua',
    });

    let nextCalled = false;
    await middleware(req, res, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.user).toBeDefined();
    expect(req.context.authStrategy).toBe('bulletproof');
    expect(req.context.auth).toBeDefined();
    expect(SignedRequest.verify).toHaveBeenCalled();
  });

  it('JwtAuthMiddleware skips when bulletproof already authenticated', async () => {
    const jwt = JwtAuthMiddleware.create();
    const { req, res } = createReqRes({ authorization: 'Bearer token' });
    req.user = { sub: '1' };
    req.context.authStrategy = 'bulletproof';

    let nextCalled = false;
    await jwt(req, res, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });
});
