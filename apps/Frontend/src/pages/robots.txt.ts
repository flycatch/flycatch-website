import type { APIRoute } from 'astro';
import { apiOrigin } from '../lib/public-api';

// Dynamic env key — Vite must not replace this at build time (ConfigMap sets it in k8s).
const publicEnvironment =
  process.env['PUBLIC_ENVIRONMENT'] || import.meta.env.PUBLIC_ENVIRONMENT || 'development';
const isProduction = publicEnvironment === 'production';

export const GET: APIRoute = () => {
  const body = isProduction
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        'Disallow: /admin',
        'Disallow: /api',
        '',
        `Sitemap: ${apiOrigin()}/sitemap.xml`,
        '',
      ].join('\n')
    : ['User-agent: *', 'Disallow: /', ''].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
