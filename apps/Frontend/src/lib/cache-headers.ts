const FORM_PATH_PREFIXES = ['/api/forms', '/api/subscribe'];
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const HTML_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=600';
export const ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable';
export const MEDIA_CACHE_CONTROL = 'public, max-age=31536000, immutable';
export const FORM_CACHE_CONTROL = 'no-store';

export function isFormResponse(method: string, pathname: string): boolean {
  if (UNSAFE_METHODS.has(method.toUpperCase())) {
    return true;
  }
  return FORM_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function cacheControlForResponse(
  method: string,
  pathname: string,
  contentType: string | null,
): string | null {
  if (isFormResponse(method, pathname)) {
    return FORM_CACHE_CONTROL;
  }
  if ((contentType || '').toLowerCase().includes('text/html')) {
    return HTML_CACHE_CONTROL;
  }
  return null;
}
