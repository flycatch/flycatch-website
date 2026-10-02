import { defineMiddleware } from 'astro:middleware';
import { requestHostname, rewriteDevOriginInHtml } from './lib/public-origin';
import { redirectTarget } from './lib/seo-redirects';

export const onRequest = defineMiddleware(async (context, next) => {
  const target = redirectTarget(context.url.pathname);
  if (target !== null && target !== context.url.pathname) {
    const url = new URL(target, context.url);
    url.search = context.url.search;
    return context.redirect(url.pathname + url.search, 301);
  }

  const response = await next();
  response.headers.set('Cache-Control', 'no-store');

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  const nextHtml = rewriteDevOriginInHtml(
    html,
    requestHostname(context.url, context.request.headers),
  );
  if (nextHtml === html) {
    return new Response(html, response);
  }
  return new Response(nextHtml, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});
