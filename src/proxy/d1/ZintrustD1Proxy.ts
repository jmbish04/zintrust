import { Logger } from '@config/logger';

type D1ProxyModule = {
  ZintrustD1Proxy?: Record<string, unknown>;
  default?: unknown;
};

const MODULE_ID = '@zintrust/' + 'cloudflare-d1-proxy';

let cached: D1ProxyModule | null = null;

const load = async (): Promise<D1ProxyModule> => {
  if (cached !== null) return cached;
  try {
    // Non-literal specifier to avoid tsconfig path alias rewriting in dist builds.
    cached = (await import(MODULE_ID)) as unknown as D1ProxyModule;
    return cached;
  } catch (error) {
    Logger.error(
      `Optional dependency not installed: ${MODULE_ID}. Install it to use ZintrustD1Proxy.`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
  return undefined as unknown as D1ProxyModule;
};

// Proxy surface that defers loading until first usage.
export const ZintrustD1Proxy = new Proxy(
  {},
  {
    get(_target, prop: string | symbol) {
      if (prop === Symbol.toStringTag) return 'ZintrustD1Proxy';

      return async (...args: unknown[]) => {
        const mod = await load();
        const target = mod.ZintrustD1Proxy ?? (mod.default as Record<string, unknown> | undefined);

        if (!target || typeof target !== 'object') {
          Logger.error(`Invalid module export from ${MODULE_ID}: missing ZintrustD1Proxy`);

          return undefined;
        }

        const value = target[prop as never];
        if (typeof value !== 'function') return value;
        return (value as (...innerArgs: unknown[]) => unknown)(...args);
      };
    },
  }
) as unknown as Record<string, unknown>;

export default ZintrustD1Proxy;
