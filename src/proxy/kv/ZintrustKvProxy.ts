import { ErrorFactory } from '@exceptions/ZintrustError';

type KvProxyModule = {
  ZintrustKvProxy?: Record<string, unknown>;
  default?: unknown;
};

const MODULE_ID = '@zintrust/' + 'cloudflare-kv-proxy';

let cached: KvProxyModule | null = null;

const load = async (): Promise<KvProxyModule> => {
  if (cached !== null) return cached;
  try {
    // Non-literal specifier to avoid tsconfig path alias rewriting in dist builds.
    cached = (await import(MODULE_ID)) as unknown as KvProxyModule;
    return cached;
  } catch (error) {
    throw ErrorFactory.createConfigError(
      `Optional dependency not installed: ${MODULE_ID}. Install it to use ZintrustKvProxy.`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
};

export const ZintrustKvProxy = new Proxy(
  {},
  {
    get(_target, prop: string | symbol) {
      if (prop === Symbol.toStringTag) return 'ZintrustKvProxy';

      return async (...args: unknown[]) => {
        const mod = await load();
        const target = mod.ZintrustKvProxy ?? (mod.default as Record<string, unknown> | undefined);

        if (!target || typeof target !== 'object') {
          throw ErrorFactory.createConfigError(
            `Invalid module export from ${MODULE_ID}: missing ZintrustKvProxy`
          );
        }

        const value = target[prop as never];
        if (typeof value !== 'function') return value;
        return (value as (...innerArgs: unknown[]) => unknown)(...args);
      };
    },
  }
) as unknown as Record<string, unknown>;

export default ZintrustKvProxy;
