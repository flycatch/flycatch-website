import { describe, expect, it } from 'vitest';
import { resolveApiBase } from '../../src/lib/admin-api';

describe('resolveApiBase', () => {
  it('uses same-origin /api/v1 when PUBLIC_ORIGIN is unset', () => {
    expect(resolveApiBase(undefined)).toBe('/api/v1');
    expect(resolveApiBase('')).toBe('/api/v1');
  });

  it('prefixes an absolute PUBLIC_ORIGIN when provided', () => {
    expect(resolveApiBase('https://flycatch-website-dev.k3s.flycatchtech.in')).toBe(
      'https://flycatch-website-dev.k3s.flycatchtech.in/api/v1',
    );
  });
});
