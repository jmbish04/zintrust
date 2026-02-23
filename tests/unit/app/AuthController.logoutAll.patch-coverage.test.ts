/* eslint-disable max-nested-callbacks */
import type { IRequest } from '@http/Request';
import type { IResponse } from '@http/Response';
import { describe, expect, it, vi } from 'vitest';

describe('patch coverage: AuthController.logoutAll', () => {
  it('returns 401 when req.user.sub missing; logs out all when present', async () => {
    vi.resetModules();

    const logoutAll = vi.fn(async () => undefined);

    vi.doMock('@security/JwtManager', () => ({
      JwtManager: {
        logoutAll,
        logout: vi.fn(async () => undefined),
        signAccessToken: vi.fn(async () => 't'),
      },
    }));

    const { AuthController } = await import('@app/Controllers/AuthController');

    const controller = AuthController.create();

    const makeRes = () => {
      const res: any = {
        statusCode: 200,
        payload: undefined as unknown,
        setStatus(code: number) {
          res.statusCode = code;
          return res;
        },
        json(payload: unknown) {
          res.payload = payload;
          return res;
        },
      };
      return res as IResponse & { statusCode: number; payload: unknown };
    };

    const res1 = makeRes();
    await controller.logoutAll({ user: undefined } as IRequest, res1);
    expect((res1 as any).statusCode).toBe(401);

    const res2 = makeRes();
    await controller.logoutAll({ user: { sub: ' u1 ' } } as IRequest, res2);
    expect(logoutAll).toHaveBeenCalledWith('u1');
    expect((res2 as any).payload).toEqual({ message: 'Logged out everywhere' });
  });
});
