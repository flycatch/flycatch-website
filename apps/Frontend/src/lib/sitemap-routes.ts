import { normalizePublicPath } from './metadata';

export type SitemapChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

export type SitemapEntryMeta = {
  changefreq: SitemapChangeFreq;
  priority: string;
};

/** Static paths in production sitemap order (core block before CMS details). */
export const SITEMAP_STATIC_CORE: string[] = [
  '/',
  '/services',
  '/solutions',
  '/case-studies',
  '/software-development-services-in-saudi-arabia',
  '/contact-us',
  '/company/about-us',
  '/services/application-development-services',
  '/services/application-modernization',
  '/services/mobile-application-development',
  '/services/user-centered-design',
  '/services/cloud-migration',
  '/services/data-migration',
  '/services/devOps-consultation',
  '/services/infrastructure-management-and-automation',
  '/services/digital-transformation',
  '/services/ai-services',
  '/solutions/credit-life',
  '/solutions/com-bus',
  '/solutions/procure-flex',
  '/company/careers',
  '/company/jobs-openings',
  '/company/blogs',
  '/company/clients',
  '/company/testimonials',
  '/company/resources',
  '/company/memberships',
  '/company/news-and-events',
  '/privacy-policy',
  '/terms-and-conditions',
];

/** Solution product URLs that production lists after job openings. */
export const SITEMAP_STATIC_TAIL: string[] = [
  '/solutions/ai-chat-support',
  '/solutions/flyGrid-ai',
  '/solutions/doctCare-ai',
  '/solutions/talkShop-ai',
  '/solutions/docSis-ai',
];

const SOLUTION_PRIORITY_08 = new Set([
  '/solutions/credit-life',
  '/solutions/com-bus',
  '/solutions/procure-flex',
]);

/** Match production sitemap changefreq/priority by path. */
export function sitemapMetaForPath(path: string): SitemapEntryMeta {
  const normalized = normalizePublicPath(path);

  if (normalized === '/') return { changefreq: 'daily', priority: '1' };

  if (normalized === '/services' || normalized === '/solutions') {
    return { changefreq: 'monthly', priority: '0.9' };
  }
  if (normalized === '/software-development-services-in-saudi-arabia') {
    return { changefreq: 'monthly', priority: '0.9' };
  }
  if (normalized === '/case-studies') return { changefreq: 'weekly', priority: '0.8' };
  if (normalized.startsWith('/services/')) return { changefreq: 'monthly', priority: '0.8' };

  if (normalized.startsWith('/solutions/')) {
    const priority = SOLUTION_PRIORITY_08.has(normalized) ? '0.8' : '0.7';
    return { changefreq: 'monthly', priority };
  }

  if (normalized.startsWith('/case-studies/')) {
    return { changefreq: 'monthly', priority: '0.7' };
  }

  if (normalized.startsWith('/company/blogs/')) {
    return { changefreq: 'weekly', priority: '0.5' };
  }
  if (normalized.startsWith('/company/jobs-openings/')) {
    return { changefreq: 'weekly', priority: '0.5' };
  }

  if (normalized === '/company/blogs') return { changefreq: 'weekly', priority: '0.7' };
  if (normalized === '/company/news-and-events') return { changefreq: 'weekly', priority: '0.5' };
  if (normalized === '/company/about-us') return { changefreq: 'monthly', priority: '0.7' };
  if (normalized === '/company/careers' || normalized === '/company/jobs-openings') {
    return { changefreq: 'monthly', priority: '0.6' };
  }
  if (normalized === '/company/memberships') return { changefreq: 'monthly', priority: '0.4' };
  if (
    normalized === '/company/clients' ||
    normalized === '/company/testimonials' ||
    normalized === '/company/resources'
  ) {
    return { changefreq: 'monthly', priority: '0.5' };
  }

  if (normalized === '/contact-us') return { changefreq: 'yearly', priority: '0.6' };
  if (normalized === '/privacy-policy' || normalized === '/terms-and-conditions') {
    return { changefreq: 'yearly', priority: '0.2' };
  }

  return { changefreq: 'monthly', priority: '0.5' };
}

/** Static marketing paths that should appear in the public sitemap (no trailing slash). */
export function staticSitemapPaths(): string[] {
  return [...SITEMAP_STATIC_CORE, ...SITEMAP_STATIC_TAIL].map(normalizePublicPath);
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Production-style loc: apex home has no trailing slash. */
export function sitemapLoc(origin: string, path: string): string {
  const base = origin.replace(/\/$/, '');
  const normalized = normalizePublicPath(path);
  if (normalized === '/') return base;
  return `${base}${normalized}`;
}

export function buildSitemapXml(
  origin: string,
  paths: string[],
  lastmod: string = new Date().toISOString(),
): string {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const path of paths) {
    const normalized = normalizePublicPath(path);
    if (seen.has(normalized)) continue;
    if (normalized === '/about' || normalized.endsWith('/combus')) continue;
    seen.add(normalized);
    unique.push(normalized);
  }

  const urls = unique
    .map((path) => {
      const meta = sitemapMetaForPath(path);
      const loc = sitemapLoc(origin, path);
      return [
        '<url>',
        `<loc>${escapeXml(loc)}</loc>`,
        `<lastmod>${escapeXml(lastmod)}</lastmod>`,
        `<changefreq>${meta.changefreq}</changefreq>`,
        `<priority>${meta.priority}</priority>`,
        '</url>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}
