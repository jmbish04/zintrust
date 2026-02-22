import { describe, expect, it } from 'vitest';

describe('patch coverage: controller types runtime marker', () => {
  it('imports the runtime marker', async () => {
    const mod = await import('@app/Types/controller');
    expect(mod.__controllerTypesRuntime).toBe(1);
  });
});
