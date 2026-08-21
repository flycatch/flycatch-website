import type { SeoMetadata, SiteSettings } from './published-snapshot';
import type { ContentSeo, PublicHome } from './public-homes';

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

export function metadataFromContentSeo(seo: ContentSeo, siteSettings: SiteSettings): PageMetadata {
  const title = seo.meta_title.trim() || seo.title.trim() || siteSettings.site_name;
  const description = seo.description.trim() || siteSettings.site_name;
  const canonical =
    seo.canonical_url.startsWith('http://') || seo.canonical_url.startsWith('https://')
      ? seo.canonical_url
      : buildCanonicalUrl(siteSettings.canonical_origin, seo.canonical_url || '/');
  return {
    title,
    description,
    canonical,
    socialTitle: seo.title.trim() || title,
    socialDescription: description,
    socialImageKey: seo.image_key ?? siteSettings.default_social_image_key ?? null,
    indexable: true,
  };
}

export function homeStructuredData(home: PublicHome, metadata: PageMetadata, siteSettings: SiteSettings) {
  const blocks: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteSettings.site_name,
      url: siteSettings.canonical_origin,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: home.banner_title || home.title,
      description: metadata.description,
      url: metadata.canonical,
    },
  ];
  if (home.faqs.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: home.faqs
        .filter((faq) => faq.title && faq.contents)
        .map((faq) => ({
          '@type': 'Question',
          name: faq.title,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.contents,
          },
        })),
    });
  }
  return blocks;
}
