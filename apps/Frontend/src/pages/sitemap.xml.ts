import type { APIRoute } from 'astro';
import { apiOrigin } from '../lib/public-api';
import {
  loadPublishedBlogs,
  loadPublishedCaseStudies,
  loadPublishedOpenings,
} from '../lib/public-api';
import {
  buildSitemapXml,
  SITEMAP_STATIC_CORE,
  SITEMAP_STATIC_TAIL,
} from '../lib/sitemap-routes';

export const GET: APIRoute = async () => {
  const origin = apiOrigin();
  const lastmod = new Date().toISOString();

  const [blogs, caseStudies, openings] = await Promise.all([
    loadPublishedBlogs(),
    loadPublishedCaseStudies(),
    loadPublishedOpenings(),
  ]);

  const casePaths =
    caseStudies.error
      ? []
      : caseStudies.items
          .filter((item) => item.slug)
          .map((item) => `/case-studies/${item.slug}`);

  const blogPaths =
    blogs.error
      ? []
      : blogs.items
          .filter((item) => item.slug)
          .map((item) => `/company/blogs/${item.slug}`);

  const jobPaths =
    openings.error
      ? []
      : openings.items
          .filter((item) => item.slug)
          .map((item) => `/company/jobs-openings/${item.slug}`);

  // Production order: static core → case studies → blogs → jobs → AI solutions tail
  const paths = [
    ...SITEMAP_STATIC_CORE,
    ...casePaths,
    ...blogPaths,
    ...jobPaths,
    ...SITEMAP_STATIC_TAIL,
  ];

  const xml = buildSitemapXml(origin, paths, lastmod);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
