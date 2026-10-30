import type { APIContext } from 'astro';
import {
  SOURCE_COOKIE,
  SOURCE_COOKIE_MAX_AGE,
  resolveCareersLink,
  visitorIp,
} from './careers-api';

const CODE = /^[A-Za-z0-9]{5}(?:-[a-z]{2})?$/;
const LISTING = '/company/jobs-openings';

/**
 * Opens a short link (/j/<code>): counts the click in the HRMS, remembers the source for the application,
 * then sends the visitor to the job page. Unknown, closed or malformed links land on the listing.
 */
export async function followShortLink(context: APIContext, code: string | undefined): Promise<Response> {
  if (!code || !CODE.test(code)) return context.redirect(LISTING, 302);
  const { link } = await resolveCareersLink(code, visitorIp(context.request.headers, context.clientAddress));
  if (!link) return context.redirect(LISTING, 302);
  if (link.source) {
    context.cookies.set(SOURCE_COOKIE, link.source.slice(0, 60), {
      path: '/',
      maxAge: SOURCE_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: context.url.protocol === 'https:',
      httpOnly: false,
    });
  }
  return context.redirect(`${LISTING}/${encodeURIComponent(link.openingCode)}`, 302);
}
