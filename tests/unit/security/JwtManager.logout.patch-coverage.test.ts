/* eslint-disable max-nested-callbacks */
import { describe, expect, it, vi } from 'vitest';

describe('patch coverage: JwtManager.logout wrappers', () => {
  it('delegates to JwtSessions.logout and logoutAll', async () => {
    vi.resetModules();

    const logout = vi.fn(async () => undefined);
    const logoutAll = vi.fn(async () => undefined);

    vi.doMock('@security/JwtSessions', () => ({
      JwtSessions: {
        logout,
        logoutAll,
        register: vi.fn(async () => undefined),
      },
    }));

    vi.doMock('@/config', () => ({
      securityConfig: {
        jwt: {
          algorithm: 'HS256',
          secret: 's',
          expiresIn: 60,
          issuer: 'ZinTrust',
          audience: 'tests',
        },
      },
    }));

    const { JwtManager } = await import('@/security/JwtManager');

    await JwtManager.logout('Bearer token');
    await JwtManager.logoutAll('user-1');

    expect(logout).toHaveBeenCalledWith('Bearer token');
    expect(logoutAll).toHaveBeenCalledWith('user-1');
  });
});
