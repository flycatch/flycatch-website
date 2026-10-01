import { describe, expect, it } from 'vitest';
import {
  blogListingPageCount,
  blogListingPath,
  parseBlogListingPage,
  visibleBlogPages,
} from '../../src/lib/blog-listing';

describe('blog listing pages', () => {
  it('keeps page 1 on the bare index path', () => {
    expect(blogListingPath(1)).toBe('/company/blogs');
    expect(blogListingPath(0)).toBe('/company/blogs');
    expect(blogListingPath(2)).toBe('/company/blogs?page=2');
  });

  it('parses a page query', () => {
    expect(parseBlogListingPage(null)).toBe(1);
    expect(parseBlogListingPage('')).toBe(1);
    expect(parseBlogListingPage('3')).toBe(3);
    expect(parseBlogListingPage('0')).toBeNull();
    expect(parseBlogListingPage('-1')).toBeNull();
    expect(parseBlogListingPage('1.5')).toBeNull();
    expect(parseBlogListingPage('abc')).toBeNull();
  });

  it('counts pages from the published total', () => {
    expect(blogListingPageCount(0, 10)).toBe(1);
    expect(blogListingPageCount(10, 10)).toBe(1);
    expect(blogListingPageCount(11, 10)).toBe(2);
    expect(blogListingPageCount(63, 10)).toBe(7);
  });

  it('lists every page when there are nine or fewer', () => {
    expect(visibleBlogPages(1, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(visibleBlogPages(5, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('windows a longer catalog around the current page', () => {
    expect(visibleBlogPages(1, 20)).toEqual([1, 2, 3, '…', 20]);
    expect(visibleBlogPages(10, 20)).toEqual([1, '…', 8, 9, 10, 11, 12, '…', 20]);
    expect(visibleBlogPages(19, 20)).toEqual([1, '…', 17, 18, 19, 20]);
  });
});
