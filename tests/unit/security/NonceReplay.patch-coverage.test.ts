import { describe, expect, it, vi } from 'vitest';

import { NonceReplay } from '@/security/NonceReplay';

describe('patch coverage: NonceReplay', () => {
  it('rejects replays and runs cleanup sweeps', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-22T00:00:00.000Z'));

    const verifier = NonceReplay.createMemoryVerifier({ cleanupEvery: 1, maxEntries: 1 });

    // First accept
    await expect(verifier('k1', 'n1', 10)).resolves.toBe(true);

    // Replay before expiry
    await expect(verifier('k1', 'n1', 10)).resolves.toBe(false);

    // Advance beyond expiry and accept a different nonce to trigger cleanup loop
    vi.setSystemTime(new Date('2026-02-22T00:00:10.000Z'));
    await expect(verifier('k1', 'n2', 1)).resolves.toBe(true);

    vi.useRealTimers();
  });
});
