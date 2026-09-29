import { defineMiddleware } from 'astro:middleware';
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
  return response;
});
