import { describe, expect, it } from 'vitest';
import { portalUrl } from '../../src/lib/portal-link';

describe('portalUrl', () => {
  it('returns the origin of a valid http(s) url', () => {
    expect(portalUrl('https://auth-dev.k3s.flycatchtech.in/')).toBe(
      'https://auth-dev.k3s.flycatchtech.in',
    );
    expect(portalUrl(' http://localhost:5173/some/path ')).toBe('http://localhost:5173');
  });

  it('returns null when unset or not a plain web origin', () => {
    expect(portalUrl(undefined)).toBeNull();
    expect(portalUrl('')).toBeNull();
    expect(portalUrl('not a url')).toBeNull();
    expect(portalUrl('javascript:alert(1)')).toBeNull();
  });
});
