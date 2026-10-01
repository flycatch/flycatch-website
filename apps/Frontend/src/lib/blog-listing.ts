/** Path for a blog index page. Page 1 has no query string. */
export function blogListingPath(page: number): string {
  if (page <= 1) return '/company/blogs';
  return `/company/blogs?page=${page}`;
}

/**
 * Parse `?page=`. Missing means page 1.
 * Returns null for zero, negatives, and non-integers.
 */
export function parseBlogListingPage(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return 1;
  if (!/^[1-9]\d*$/.test(raw.trim())) return null;
  const page = Number(raw);
  if (!Number.isSafeInteger(page)) return null;
  return page;
}

/** How many index pages are needed. At least 1 so the empty index stays addressable. */
export function blogListingPageCount(total: number, perPage: number): number {
  if (perPage < 1 || total < 1) return 1;
  return Math.ceil(total / perPage);
}

export type BlogPageMarker = number | '…';

/**
 * Page numbers to show in the listing pager.
 * Nine or fewer pages list every number. Longer catalogs keep 1, the last page,
 * the current page, and two neighbors, with gaps as ellipses.
 */
export function visibleBlogPages(current: number, total: number): BlogPageMarker[] {
  if (total < 1) return [];
  const safeCurrent = Math.min(Math.max(current, 1), total);
  if (total <= 9) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total]);
  for (let n = safeCurrent - 2; n <= safeCurrent + 2; n += 1) {
    if (n >= 1 && n <= total) pages.add(n);
  }
  const ordered = [...pages].sort((a, b) => a - b);
  const markers: BlogPageMarker[] = [];
  for (let i = 0; i < ordered.length; i += 1) {
    const page = ordered[i];
    const previous = ordered[i - 1];
    if (previous !== undefined && page - previous > 1) markers.push('…');
    markers.push(page);
  }
  return markers;
}
