import { describe, expect, it } from 'vitest';
import { formatNewsDate, formatNewsDetailDate, newsMetaLabel, youtubeEmbedUrl } from '../../src/lib/news-media';

describe('news media', () => {
  it('turns YouTube watch, short, and share URLs into embeds', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=abc123')).toBe(
      'https://www.youtube.com/embed/abc123',
    );
    expect(youtubeEmbedUrl('https://youtube.com/shorts/shortId?feature=share')).toBe(
      'https://www.youtube.com/embed/shortId',
    );
    expect(youtubeEmbedUrl('https://youtu.be/shareId')).toBe('https://www.youtube.com/embed/shareId');
    expect(youtubeEmbedUrl('https://example.com/watch?v=abc123')).toBeNull();
    expect(youtubeEmbedUrl('')).toBeNull();
  });

  it('formats reading time with the record date', () => {
    expect(formatNewsDate('2026-09-24T00:00:00.000Z')).toBe('24 September 2026');
    expect(newsMetaLabel(3, '2026-09-05T00:00:00.000Z')).toBe('3 min read | 05 September 2026');
    expect(formatNewsDetailDate('2026-09-01T00:00:00.000Z')).toBe('1st Sep 2026');
    expect(formatNewsDetailDate('2026-09-02T00:00:00.000Z')).toBe('2nd Sep 2026');
    expect(formatNewsDetailDate('2026-09-03T00:00:00.000Z')).toBe('3rd Sep 2026');
    expect(formatNewsDetailDate('2026-09-11T00:00:00.000Z')).toBe('11th Sep 2026');
    expect(formatNewsDetailDate('2026-09-21T00:00:00.000Z')).toBe('21st Sep 2026');
  });
});
