import { BulletproofKeyGenerateCommand } from '@cli/commands/BulletproofKeyGenerateCommand';
import { Logger } from '@config/logger';
import { fsPromises as fs } from '@node-singletons/fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@config/logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@node-singletons/fs', () => ({
  fsPromises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock('@node-singletons/crypto', () => ({
  randomBytes: vi.fn().mockReturnValue({
    toString: vi.fn().mockReturnValue('mocked-b64'),
  }),
}));

describe('patch coverage: BulletproofKeyGenerateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prints env lines and exits when --show=true', async () => {
    const command = BulletproofKeyGenerateCommand.create();
    await command.execute({ show: true, maxBackups: '5' } as any);

    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining('BULLETPROOF_SIGNING_SECRET=base64:mocked-b64')
    );
    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining('BULLETPROOF_SIGNING_SECRET_BK=[]')
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('updates existing .env and rotates secret into backups (JSON array)', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(
      [
        'BULLETPROOF_SIGNING_SECRET=old-secret',
        'BULLETPROOF_SIGNING_SECRET_BK=["old0","old1"]',
        'OTHER_VAR=value',
      ].join('\n')
    );

    const command = BulletproofKeyGenerateCommand.create();
    await command.execute({ maxBackups: '2' } as any);

    expect(fs.writeFile).toHaveBeenCalledTimes(1);

    const written = String((vi.mocked(fs.writeFile).mock.calls[0] ?? [])[1] ?? '');
    expect(written).toContain('BULLETPROOF_SIGNING_SECRET=base64:mocked-b64');
    // maxBackups=2: current secret + first old backup
    expect(written).toContain('BULLETPROOF_SIGNING_SECRET_BK=["old-secret","old0"]');
  });

  it('creates .env from .env.example when missing, then writes new secret', async () => {
    vi.mocked(fs.readFile)
      .mockRejectedValueOnce(new Error('missing .env'))
      .mockResolvedValueOnce('OTHER_VAR=example\nBULLETPROOF_SIGNING_SECRET=from-example');

    const command = BulletproofKeyGenerateCommand.create();
    await command.execute({ maxBackups: '5' } as any);

    // copy .env.example -> .env, then write updated content
    expect(fs.writeFile).toHaveBeenCalledTimes(2);
    expect(Logger.info).toHaveBeenCalledWith('.env file created from .env.example');

    const finalWrite = String((vi.mocked(fs.writeFile).mock.calls[1] ?? [])[1] ?? '');
    expect(finalWrite).toContain('BULLETPROOF_SIGNING_SECRET=base64:mocked-b64');
    expect(finalWrite).toContain('BULLETPROOF_SIGNING_SECRET_BK=["from-example"]');
  });

  it('creates a new .env when neither .env nor .env.example exist', async () => {
    vi.mocked(fs.readFile)
      .mockRejectedValueOnce(new Error('missing .env'))
      .mockRejectedValueOnce(new Error('missing .env.example'));

    const command = BulletproofKeyGenerateCommand.create();
    await command.execute({} as any);

    expect(Logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('.env file not found and .env.example not found')
    );

    const written = String((vi.mocked(fs.writeFile).mock.calls[0] ?? [])[1] ?? '');
    expect(written).toContain('BULLETPROOF_SIGNING_SECRET=base64:mocked-b64');
    expect(written).toContain('BULLETPROOF_SIGNING_SECRET_BK=[]');
  });

  it('logs error when writing .env fails', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('BULLETPROOF_SIGNING_SECRET=old');
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('write failed'));

    const command = BulletproofKeyGenerateCommand.create();
    await command.execute({} as any);

    expect(Logger.error).toHaveBeenCalledWith('Failed to update .env file', expect.any(Error));
  });

  it('handles invalid JSON backups gracefully', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(
      ['BULLETPROOF_SIGNING_SECRET=old-secret', 'BULLETPROOF_SIGNING_SECRET_BK=[invalid-json'].join(
        '\n'
      )
    );

    const command = BulletproofKeyGenerateCommand.create();
    await command.execute({ maxBackups: '2' } as any);

    const written = String((vi.mocked(fs.writeFile).mock.calls[0] ?? [])[1] ?? '');
    expect(written).toContain('BULLETPROOF_SIGNING_SECRET_BK=["old-secret"]');
  });

  it('handles non-array JSON backups gracefully', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(
      [
        'BULLETPROOF_SIGNING_SECRET=old-secret',
        'BULLETPROOF_SIGNING_SECRET_BK=[{"not":"array"}]',
      ].join('\n')
    );

    const command = BulletproofKeyGenerateCommand.create();
    await command.execute({ maxBackups: '2' } as any);

    const written = String((vi.mocked(fs.writeFile).mock.calls[0] ?? [])[1] ?? '');
    expect(written).toContain('BULLETPROOF_SIGNING_SECRET_BK=["old-secret"]');
  });

  it('filters out non-strings and empty strings from JSON backups', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(
      [
        'BULLETPROOF_SIGNING_SECRET=old-secret',
        'BULLETPROOF_SIGNING_SECRET_BK=["valid", 123, " ", "also-valid"]',
      ].join('\n')
    );

    const command = BulletproofKeyGenerateCommand.create();
    await command.execute({ maxBackups: '3' } as any);

    const written = String((vi.mocked(fs.writeFile).mock.calls[0] ?? [])[1] ?? '');
    expect(written).toContain('BULLETPROOF_SIGNING_SECRET_BK=["old-secret","valid","also-valid"]');
  });

  it('parses comma-separated backups and trims/filters empties', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(
      ['BULLETPROOF_SIGNING_SECRET=old-secret', 'BULLETPROOF_SIGNING_SECRET_BK=  a, , b ,  '].join(
        '\n'
      )
    );

    const command = BulletproofKeyGenerateCommand.create();
    await command.execute({ maxBackups: '5' } as any);

    const written = String((vi.mocked(fs.writeFile).mock.calls[0] ?? [])[1] ?? '');
    expect(written).toContain('BULLETPROOF_SIGNING_SECRET_BK=["old-secret","a","b"]');
  });
});
