import { describe, expect, it } from 'vitest';

import { imageAlt, isRemoteMedia, resolveMediaSrc } from '../../src/lib/image';

describe('image helpers', () => {
  it('turns CMS media paths into absolute URLs for astro:assets', () => {
    const src = resolveMediaSrc('/api/v1/public/media/hero.webp', 'http://backend:8000');
    expect(src).toBeInstanceOf(URL);
    expect(String(src)).toBe('http://backend:8000/api/v1/public/media/hero.webp');
    expect(isRemoteMedia(src)).toBe(true);
  });

  it('leaves static public assets as local paths', () => {
    expect(resolveMediaSrc('/contact-us-sphere.webp')).toBe('/contact-us-sphere.webp');
    expect(isRemoteMedia('/contact-us-sphere.webp')).toBe(false);
  });

  it('falls back when CMS alt text is empty', () => {
    expect(imageAlt('', 'AI services')).toBe('AI services');
    expect(imageAlt('  Industry photo  ', 'unused')).toBe('Industry photo');
  });
});
