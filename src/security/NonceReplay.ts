export type NonceReplayVerifier = (keyId: string, nonce: string, ttlMs: number) => Promise<boolean>;

export type MemoryNonceReplayOptions = {
  /**
   * Cleanup interval to prevent unbounded map growth.
   * Default: 500 accepted nonces.
   */
  cleanupEvery?: number;
  /**
   * Maximum nonce entries to keep before forcing a cleanup sweep.
   * Default: 25_000.
   */
  maxEntries?: number;
};

type NonceEntry = {
  expiresAtMs: number;
};

const DEFAULTS: Required<MemoryNonceReplayOptions> = {
  cleanupEvery: 500,
  maxEntries: 25_000,
} as const;

export const NonceReplay = Object.freeze({
  /**
   * In-memory, best-effort replay protection.
   *
   * Works in both Node and Workers, but does not provide cross-instance guarantees.
   * For strict production replay protection, supply your own verifier backed by Redis/KV.
   */
  createMemoryVerifier(options: MemoryNonceReplayOptions = {}): NonceReplayVerifier {
    const cleanupEvery = options.cleanupEvery ?? DEFAULTS.cleanupEvery;
    const maxEntries = options.maxEntries ?? DEFAULTS.maxEntries;

    const store = new Map<string, NonceEntry>();
    let accepted = 0;

    const cleanup = (nowMs: number): void => {
      for (const [key, entry] of store.entries()) {
        if (entry.expiresAtMs <= nowMs) store.delete(key);
      }
    };

    return async (keyId: string, nonce: string, ttlMs: number): Promise<boolean> => {
      const nowMs = Date.now();
      const expiresAtMs = nowMs + Math.max(1, ttlMs);
      const compositeKey = `${keyId}:${nonce}`;

      const existing = store.get(compositeKey);
      if (existing !== undefined && existing.expiresAtMs > nowMs) {
        await Promise.resolve();
        return false;
      }

      store.set(compositeKey, { expiresAtMs });
      accepted += 1;

      if (store.size > maxEntries || accepted % cleanupEvery === 0) {
        cleanup(nowMs);
      }

      await Promise.resolve();
      return true;
    };
  },
});

export default NonceReplay;
