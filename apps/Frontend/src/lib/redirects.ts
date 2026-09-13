import mapping from '../../../../openspec/changes/migrate-flycatch-website/baseline/url-mapping.json';
import { normalizePublicPath } from './route-registry';

type MappingRule = {
  from: string;
  to: string;
  status: number;
};

type UrlMapping = {
  case_variants: MappingRule[];
  inherited_redirects: MappingRule[];
  non_sitemap_200: MappingRule[];
};

const data = mapping as UrlMapping;

export const CANONICAL_HOST = 'www.flycatchtech.com';
export const APEX_HOST = 'flycatchtech.com';

export function applicationRedirectRules(): MappingRule[] {
  const extras: MappingRule[] = [];
  for (const rule of [...data.case_variants, ...data.inherited_redirects, ...data.non_sitemap_200]) {
    if (rule.status !== 301) continue;
    if (rule.from.includes(':')) continue;
    extras.push({ from: normalizePublicPath(rule.from), to: rule.to, status: 301 });
  }
  return extras;
}

const exactRedirects = new Map(
  applicationRedirectRules().map((rule) => [rule.from, rule.to] as const),
);

export function localePrefixRedirect(pathname: string): string | null {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) {
    const rest = pathname.slice('/en'.length);
    return rest || '/';
  }
  return null;
}

export function trailingSlashRedirect(pathname: string): string | null {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '') || '/';
  }
  return null;
}

export function hostSchemeRedirect(protocol: string, host: string, url: string): string | null {
  const hostname = host.split(':')[0] ?? host;
  const isCanonicalSite = hostname === CANONICAL_HOST || hostname === APEX_HOST;
  if (!isCanonicalSite) return null;
  const parsed = new URL(url);
  if (protocol === 'http:' || hostname === APEX_HOST) {
    parsed.protocol = 'https:';
    parsed.host = CANONICAL_HOST;
    return parsed.toString();
  }
  return null;
}

export function redirectForPath(pathname: string): string | null {
  const normalized = normalizePublicPath(pathname);
  const locale = localePrefixRedirect(normalized);
  if (locale) return locale;
  const slash = trailingSlashRedirect(pathname);
  if (slash) return slash;
  return exactRedirects.get(normalized) ?? null;
}

export function sitemapForcedPaths(): string[] {
  return data.non_sitemap_200
    .filter((rule) => rule.status === 200)
    .map((rule) => normalizePublicPath(rule.to || rule.from));
}

export function redirectHops(pathname: string, seen: string[] = []): string[] {
  const next = redirectForPath(pathname);
  if (!next) return seen;
  if (seen.includes(next) || next === pathname) {
    throw new Error(`Redirect loop at ${pathname}`);
  }
  return redirectHops(next, [...seen, next]);
}
