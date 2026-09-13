export const BLOG_PAGE_SIZE = 12;
export const CASE_STUDY_PAGE_SIZE = 9;

export type PageWindow<T> = {
  items: T[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export function parsePageParam(value: string | null | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function paginate<T>(items: T[], page: number, pageSize: number): PageWindow<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    pageSize,
    total,
    hasPrevious: current > 1,
    hasNext: current < pageCount,
  };
}

export function listingPageHref(basePath: string, page: number): string {
  if (page <= 1) return basePath;
  return `${basePath}?page=${page}`;
}
