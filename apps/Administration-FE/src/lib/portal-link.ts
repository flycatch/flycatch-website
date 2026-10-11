/**
 * Flycatch auth portal origin, baked at build time from PUBLIC_PORTAL_URL.
 * Returns null (no link) unless it is a plain http(s) origin.
 */
export function portalUrl(raw: string | undefined = import.meta.env.PUBLIC_PORTAL_URL): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin;
  } catch {
    return null;
  }
}
