import type { SeoMetadata, SiteSettings } from './published-snapshot';

export interface PageMetadata {
  title: string;
  description: string;
  canonical: string;
  socialTitle: string;
  socialDescription: string;
  socialImageKey: string | null;
  indexable: boolean;
}

export function buildCanonicalUrl(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

export function buildPageMetadata(
  seo: SeoMetadata,
  siteSettings: SiteSettings,
): PageMetadata {
  return {
    title: seo.title,
    description: seo.description,
    canonical: buildCanonicalUrl(siteSettings.canonical_origin, seo.canonical_path),
    socialTitle: seo.social_title ?? seo.title,
    socialDescription: seo.social_description ?? seo.description,
    socialImageKey: seo.social_image_key ?? siteSettings.default_social_image_key ?? null,
    indexable: seo.indexable,
  };
}
