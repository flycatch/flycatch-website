import type { APIRoute } from 'astro';

const isProduction = (import.meta.env.PUBLIC_ENVIRONMENT || 'development') === 'production';

export const GET: APIRoute = () => {
  const body = isProduction
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        'Disallow: /admin',
        'Disallow: /api',
        '',
        'Sitemap: /sitemap-index.xml',
        '',
      ].join('\n')
    : ['User-agent: *', 'Disallow: /', ''].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
