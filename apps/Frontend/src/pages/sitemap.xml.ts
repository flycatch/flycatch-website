import type { APIRoute } from 'astro';

import { publicSiteSettings } from '../lib/metadata';
import { collectSitemapPaths, renderUrlSetXml } from '../lib/sitemap';

export const prerender = true;

export const GET: APIRoute = async () => {
  const paths = await collectSitemapPaths();
  const origin = publicSiteSettings().canonical_origin;
  return new Response(renderUrlSetXml(origin, paths), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
