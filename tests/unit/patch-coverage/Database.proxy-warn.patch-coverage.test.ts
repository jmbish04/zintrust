/* eslint-disable max-nested-callbacks */
import { describe, expect, it, vi } from 'vitest';

describe('patch coverage: Database proxy warnings', () => {
  it('warns when USE_*_PROXY is enabled but URL is empty', async () => {
    vi.resetModules();

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

    vi.doMock('@config/logger', () => ({ Logger: logger }));

    vi.doMock('@orm/adapters/MySQLProxyAdapter', () => ({
      MySQLProxyAdapter: {
        create: vi.fn().mockReturnValue({
          connect: vi.fn(),
          disconnect: vi.fn(),
          query: vi.fn(),
          queryOne: vi.fn(),
          transaction: vi.fn(),
          getType: vi.fn(() => 'mysql'),
          getPlaceholder: vi.fn(() => '?'),
          rawQuery: vi.fn(),
        }),
      },
    }));

    vi.doMock('@orm/adapters/PostgreSQLProxyAdapter', () => ({
      PostgreSQLProxyAdapter: {
        create: vi.fn().mockReturnValue({
          connect: vi.fn(),
          disconnect: vi.fn(),
          query: vi.fn(),
          queryOne: vi.fn(),
          transaction: vi.fn(),
          getType: vi.fn(() => 'postgresql'),
          getPlaceholder: vi.fn(() => '$1'),
          rawQuery: vi.fn(),
        }),
      },
    }));

    vi.doMock('@orm/adapters/SqlServerProxyAdapter', () => ({
      createSqlServerProxyAdapter: vi.fn().mockReturnValue({
        connect: vi.fn(),
        disconnect: vi.fn(),
        query: vi.fn(),
        queryOne: vi.fn(),
        transaction: vi.fn(),
        getType: vi.fn(() => 'sqlserver'),
        getPlaceholder: vi.fn(() => '@p1'),
        rawQuery: vi.fn(),
      }),
    }));

    const { Database } = await import('@/orm/Database');

    process.env['USE_MYSQL_PROXY'] = 'true';
    delete process.env['MYSQL_PROXY_URL'];
    Database.create({ driver: 'mysql', database: 'test' } as any);

    process.env['USE_POSTGRES_PROXY'] = 'true';
    delete process.env['POSTGRES_PROXY_URL'];
    Database.create({ driver: 'postgresql', database: 'test' } as any);

    process.env['USE_SQLSERVER_PROXY'] = 'true';
    delete process.env['SQLSERVER_PROXY_URL'];
    Database.create({ driver: 'sqlserver', database: 'test' } as any);

    expect(logger.warn).toHaveBeenCalled();
  });
});
