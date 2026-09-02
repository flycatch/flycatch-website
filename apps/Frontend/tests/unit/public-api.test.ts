import { describe, expect, it } from 'vitest';
import { absoluteMediaUrl, apiOrigin, fetchOrigin, publicMediaUrl } from '../../src/lib/public-api';

describe('public media URLs', () => {
  it('encodes object keys', () => {
    expect(publicMediaUrl('homes/hero video.mp4')).toBe(
      '/api/v1/public/media/homes%2Fhero%20video.mp4',
    );
    expect(publicMediaUrl(null)).toBeNull();
  });

  it('builds absolute media URLs for Open Graph', () => {
    expect(absoluteMediaUrl('http://localhost:8080', 'cover.png')).toBe(
      'http://localhost:8080/api/v1/public/media/cover.png',
    );
  });

  it('uses API_ORIGIN for server-side fetches when set', () => {
    const previous = process.env.API_ORIGIN;
    process.env.API_ORIGIN = 'http://backend:8000';
    expect(fetchOrigin()).toBe('http://backend:8000');
    expect(apiOrigin()).not.toBe('http://backend:8000');
    if (previous === undefined) delete process.env.API_ORIGIN;
    else process.env.API_ORIGIN = previous;
  });
});
