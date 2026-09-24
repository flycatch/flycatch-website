import { describe, expect, it } from 'vitest';
import { resourceAssetUrl, resourceThumbnailUrl, youtubeThumbnailUrl } from '../../src/lib/resource-media';

describe('resource media', () => {
  it('uses a YouTube thumbnail when the image field is a video URL', () => {
    expect(youtubeThumbnailUrl('https://www.youtube.com/watch?v=abc123')).toBe(
      'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
    );
    expect(youtubeThumbnailUrl('https://youtu.be/shareId')).toBe(
      'https://i.ytimg.com/vi/shareId/hqdefault.jpg',
    );
    expect(resourceThumbnailUrl('https://www.youtube.com/watch?v=abc123')).toBe(
      'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
    );
  });

  it('resolves uploaded image and PDF keys, and ignores empty values', () => {
    expect(resourceAssetUrl('guides/cover.webp')).toBe(
      '/api/v1/public/media/guides%2Fcover.webp',
    );
    expect(resourceAssetUrl('https://cdn.example.com/files/guide.pdf')).toBe(
      'https://cdn.example.com/files/guide.pdf',
    );
    expect(resourceThumbnailUrl('9085c2e371a64fd0b4151fad1e4e94bc.webp')).toBe(
      '/api/v1/public/media/9085c2e371a64fd0b4151fad1e4e94bc.webp',
    );
    expect(resourceAssetUrl('   ')).toBeNull();
    expect(resourceAssetUrl('javascript:alert(1)')).toBeNull();
  });
});
