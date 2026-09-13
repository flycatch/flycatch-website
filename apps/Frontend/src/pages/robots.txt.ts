import type { APIRoute } from 'astro';

import { publicSiteSettings } from '../lib/metadata';
import { absoluteSitemapUrl, buildRobotsTxt, isProductionEnvironment } from '../lib/robots';

export const GET: APIRoute = () => {
  const production = isProductionEnvironment(import.meta.env.PUBLIC_ENVIRONMENT);
  const sitemapUrl = absoluteSitemapUrl(publicSiteSettings().canonical_origin);
  return new Response(buildRobotsTxt(production, sitemapUrl), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
