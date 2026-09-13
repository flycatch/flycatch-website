import {
  loadPublishedBlogs,
  loadPublishedCaseStudies,
  loadPublishedNews,
  loadPublishedOpenings,
  loadPublishedResources,
} from './public-api';
import { sitemapForcedPaths } from './redirects';
import { normalizePublicPath, registeredExactPaths, sitemapEligible } from './route-registry';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function mergeSitemapPaths(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];
  for (const group of groups) {
    for (const raw of group) {
      const path = normalizePublicPath(raw);
      if (!sitemapEligible(path) || seen.has(path)) continue;
      seen.add(path);
      paths.push(path);
    }
  }
  return paths.sort((left, right) => left.localeCompare(right));
}

export function sitemapLoc(origin: string, path: string): string {
  const base = origin.replace(/\/$/, '');
  return path === '/' ? `${base}/` : `${base}${path}`;
}

export function renderUrlSetXml(origin: string, paths: string[]): string {
  const urls = paths.map((path) => {
    return `  <url>\n    <loc>${escapeXml(sitemapLoc(origin, path))}</loc>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export async function collectSitemapPaths(): Promise<string[]> {
  const staticPaths = registeredExactPaths();
  const [blogs, studies, openings, news, resources] = await Promise.all([
    loadPublishedBlogs(),
    loadPublishedCaseStudies(),
    loadPublishedOpenings(),
    loadPublishedNews(),
    loadPublishedResources(),
  ]);
  return mergeSitemapPaths(
    staticPaths,
    blogs.items.map((item) => `/company/blogs/${item.slug}`),
    studies.items.map((item) => `/case-studies/${item.slug}`),
    openings.items.map((item) => `/company/jobs-openings/${item.slug}`),
    news.items.map((item) => `/company/news-and-events/${item.slug}`),
    resources.items.map((item) => `/company/resources/${item.slug}`),
    sitemapForcedPaths(),
  );
}

export function sitemapHasDuplicateLocs(xml: string): boolean {
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  return new Set(locs).size !== locs.length;
}
