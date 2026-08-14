import type { PageContent } from './published-snapshot';

export function shouldIncludeInSitemap(page: PageContent): boolean {
  return page.seo.indexable;
}

export function filterIndexablePages(pages: PageContent[]): PageContent[] {
  return pages.filter(shouldIncludeInSitemap);
}
