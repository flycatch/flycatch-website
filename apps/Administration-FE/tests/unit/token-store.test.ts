import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();

describe('token-store', () => {
  beforeEach(() => {
    memory.clear();
    vi.resetModules();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('survives a module reload from sessionStorage', async () => {
    const first = await import('../../src/lib/token-store');
    first.setTokens('access-1', 'refresh-1');
    expect(first.hasTokens()).toBe(true);

    vi.resetModules();
    const second = await import('../../src/lib/token-store');
    expect(second.hasTokens()).toBe(true);
    expect(second.getAccessToken()).toBe('access-1');
    expect(second.getRefreshToken()).toBe('refresh-1');

    second.clearTokens();
    expect(second.hasTokens()).toBe(false);
    expect(memory.size).toBe(0);
  });
});
