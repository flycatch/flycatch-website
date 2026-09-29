import { describe, expect, it } from 'vitest';
import { redirectTarget } from '../../src/lib/seo-redirects';

describe('seo redirects', () => {
  it('strips /en locale prefix', () => {
    expect(redirectTarget('/en')).toBe('/');
    expect(redirectTarget('/en/')).toBe('/');
    expect(redirectTarget('/en/services')).toBe('/services');
    expect(redirectTarget('/en/company/blogs/example')).toBe('/company/blogs/example');
  });

  it('maps legacy and duplicate paths', () => {
    expect(redirectTarget('/about')).toBe('/company/about-us');
    expect(redirectTarget('/company/membership')).toBe('/company/memberships');
    expect(redirectTarget('/blogs/my-post')).toBe('/company/blogs/my-post');
  });

  it('strips trailing slashes and skips admin/api', () => {
    expect(redirectTarget('/services/')).toBe('/services');
    expect(redirectTarget('/')).toBeNull();
    expect(redirectTarget('/admin/blogs')).toBeNull();
    expect(redirectTarget('/api/v1/public/blogs')).toBeNull();
  });
});
