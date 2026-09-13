import { PRODUCTION_SERVICE_SLUGS, PRODUCTION_SOLUTION_SLUGS } from './page-catalog';

export type PageKind =
  | 'home'
  | 'service_index'
  | 'service'
  | 'solution_index'
  | 'solution'
  | 'case_study_index'
  | 'case_study'
  | 'about'
  | 'blog_index'
  | 'blog'
  | 'careers'
  | 'job_index'
  | 'job'
  | 'clients'
  | 'testimonials'
  | 'resource_index'
  | 'resource'
  | 'memberships'
  | 'news_index'
  | 'news'
  | 'contact'
  | 'saudi'
  | 'privacy'
  | 'terms';

export type StructuredDataType = 'WebPage' | 'BlogPosting' | 'Article' | 'Service';

export type BreadcrumbItem = {
  path: string;
  labelKey: string;
};

export type RouteRecord = {
  pageKind: PageKind;
  structuredDataType: StructuredDataType;
  inSitemap: boolean;
  labelKey: string;
  ancestors: BreadcrumbItem[];
};

export type ResolvedRoute = RouteRecord & {
  path: string;
  params: Record<string, string>;
};

type DynamicFamily = {
  prefix: string;
  pageKind: PageKind;
  structuredDataType: StructuredDataType;
  inSitemap: boolean;
  labelKey: string;
  parent: BreadcrumbItem;
};

const HOME: BreadcrumbItem = { path: '/', labelKey: 'nav.home' };

const EXACT_ROUTES: Record<string, RouteRecord> = {
  '/': {
    pageKind: 'home',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.home',
    ancestors: [],
  },
  '/services': {
    pageKind: 'service_index',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.services',
    ancestors: [HOME],
  },
  '/solutions': {
    pageKind: 'solution_index',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.solutions',
    ancestors: [HOME],
  },
  '/case-studies': {
    pageKind: 'case_study_index',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.case_studies',
    ancestors: [HOME],
  },
  '/company/about-us': {
    pageKind: 'about',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.about_us',
    ancestors: [HOME],
  },
  '/company/blogs': {
    pageKind: 'blog_index',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.blogs',
    ancestors: [HOME],
  },
  '/company/careers': {
    pageKind: 'careers',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.careers',
    ancestors: [HOME],
  },
  '/company/jobs-openings': {
    pageKind: 'job_index',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.job_openings',
    ancestors: [HOME],
  },
  '/company/clients': {
    pageKind: 'clients',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.clients',
    ancestors: [HOME],
  },
  '/company/testimonials': {
    pageKind: 'testimonials',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.testimonials',
    ancestors: [HOME],
  },
  '/company/resources': {
    pageKind: 'resource_index',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.resources',
    ancestors: [HOME],
  },
  '/company/memberships': {
    pageKind: 'memberships',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'page.memberships.title',
    ancestors: [HOME],
  },
  '/company/news-and-events': {
    pageKind: 'news_index',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'page.news.title',
    ancestors: [HOME],
  },
  '/contact-us': {
    pageKind: 'contact',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.contact_us',
    ancestors: [HOME],
  },
  '/software-development-services-in-saudi-arabia': {
    pageKind: 'saudi',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'page.saudi.title',
    ancestors: [HOME],
  },
  '/privacy-policy': {
    pageKind: 'privacy',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'page.privacy.title',
    ancestors: [HOME],
  },
  '/terms-and-conditions': {
    pageKind: 'terms',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'page.terms.title',
    ancestors: [HOME],
  },
};

for (const slug of PRODUCTION_SERVICE_SLUGS) {
  EXACT_ROUTES[`/services/${slug}`] = {
    pageKind: 'service',
    structuredDataType: 'Service',
    inSitemap: true,
    labelKey: `page.services.slug.${slug}`,
    ancestors: [HOME, { path: '/services', labelKey: 'nav.services' }],
  };
}

for (const slug of PRODUCTION_SOLUTION_SLUGS) {
  EXACT_ROUTES[`/solutions/${slug}`] = {
    pageKind: 'solution',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: `page.solutions.slug.${slug}`,
    ancestors: [HOME, { path: '/solutions', labelKey: 'nav.solutions' }],
  };
}

const DYNAMIC_FAMILIES: DynamicFamily[] = [
  {
    prefix: '/services/',
    pageKind: 'service',
    structuredDataType: 'Service',
    inSitemap: true,
    labelKey: 'nav.services',
    parent: { path: '/services', labelKey: 'nav.services' },
  },
  {
    prefix: '/solutions/',
    pageKind: 'solution',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.solutions',
    parent: { path: '/solutions', labelKey: 'nav.solutions' },
  },
  {
    prefix: '/case-studies/',
    pageKind: 'case_study',
    structuredDataType: 'Article',
    inSitemap: true,
    labelKey: 'nav.case_studies',
    parent: { path: '/case-studies', labelKey: 'nav.case_studies' },
  },
  {
    prefix: '/company/blogs/',
    pageKind: 'blog',
    structuredDataType: 'BlogPosting',
    inSitemap: true,
    labelKey: 'nav.blogs',
    parent: { path: '/company/blogs', labelKey: 'nav.blogs' },
  },
  {
    prefix: '/company/jobs-openings/',
    pageKind: 'job',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.job_openings',
    parent: { path: '/company/jobs-openings', labelKey: 'nav.job_openings' },
  },
  {
    prefix: '/company/resources/',
    pageKind: 'resource',
    structuredDataType: 'WebPage',
    inSitemap: true,
    labelKey: 'nav.resources',
    parent: { path: '/company/resources', labelKey: 'nav.resources' },
  },
  {
    prefix: '/company/news-and-events/',
    pageKind: 'news',
    structuredDataType: 'Article',
    inSitemap: true,
    labelKey: 'page.news.title',
    parent: { path: '/company/news-and-events', labelKey: 'page.news.title' },
  },
];

export function normalizePublicPath(path: string): string {
  const trimmed = path.split('#')[0]?.split('?')[0] ?? '';
  if (!trimmed || trimmed === '/') return '/';
  return trimmed.replace(/\/+$/, '') || '/';
}

export function resolveRoute(path: string): ResolvedRoute | null {
  const normalized = normalizePublicPath(path);
  const exact = EXACT_ROUTES[normalized];
  if (exact) {
    return { ...exact, path: normalized, params: {} };
  }
  for (const family of DYNAMIC_FAMILIES) {
    if (!normalized.startsWith(family.prefix)) continue;
    const slug = normalized.slice(family.prefix.length);
    if (!slug || slug.includes('/')) continue;
    return {
      pageKind: family.pageKind,
      structuredDataType: family.structuredDataType,
      inSitemap: family.inSitemap,
      labelKey: family.labelKey,
      ancestors: [HOME, family.parent],
      path: normalized,
      params: { slug },
    };
  }
  return null;
}

export function registeredExactPaths(): string[] {
  return Object.keys(EXACT_ROUTES).sort();
}

export function sitemapEligible(path: string): boolean {
  return resolveRoute(path)?.inSitemap === true;
}
