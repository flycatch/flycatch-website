import { describe, expect, it } from 'vitest';
import { resolveApiBase } from '../../src/lib/admin-api';

describe('resolveApiBase', () => {
  it('uses same-origin /api/v1 when PUBLIC_ORIGIN is unset', () => {
    expect(resolveApiBase(undefined)).toBe('/api/v1');
    expect(resolveApiBase('')).toBe('/api/v1');
  });

  it('prefixes an absolute origin for non-browser callers', () => {
    expect(resolveApiBase('https://flycatch-website-dev.k3s.flycatchtech.in')).toBe(
      'https://flycatch-website-dev.k3s.flycatchtech.in/api/v1',
    );
  });

  it('ignores a baked absolute origin in the browser', () => {
    const previous = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {},
    });
    try {
      expect(resolveApiBase('https://flycatch-website-dev.k3s.flycatchtech.in')).toBe('/api/v1');
    } finally {
      if (previous === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        Object.defineProperty(globalThis, 'window', {
          configurable: true,
          value: previous,
        });
      }
    }
  });
});
