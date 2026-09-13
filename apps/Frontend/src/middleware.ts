import { defineMiddleware } from 'astro:middleware';

import { cacheControlForResponse } from './lib/cache-headers';
import { hostSchemeRedirect, redirectForPath } from './lib/redirects';
import { htmlRobotsTag } from './lib/robots';

export const onRequest = defineMiddleware(async (context, next) => {
  const hostTarget = hostSchemeRedirect(
    context.url.protocol,
    context.url.host,
    context.url.href,
  );
  if (hostTarget) {
    return context.redirect(hostTarget, 301);
  }
  const pathTarget = redirectForPath(context.url.pathname);
  if (pathTarget) {
    const nextUrl = new URL(pathTarget, context.url);
    nextUrl.search = context.url.search;
    return context.redirect(`${nextUrl.pathname}${nextUrl.search}`, 301);
  }
  const response = await next();
  const cacheControl = cacheControlForResponse(
    context.request.method,
    context.url.pathname,
    response.headers.get('content-type'),
  );
  if (cacheControl) {
    response.headers.set('Cache-Control', cacheControl);
  }
  const robotsTag = htmlRobotsTag(import.meta.env.PUBLIC_ENVIRONMENT);
  if (robotsTag) {
    response.headers.set('X-Robots-Tag', robotsTag);
  }
  return response;
});
