import type { PageMetadata } from './metadata';
import type { SeoMetadata, SiteSettings } from './published-snapshot';

export function buildOrganizationJsonLd(siteSettings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteSettings.site_name,
    url: siteSettings.canonical_origin,
  };
}

export function buildWebPageJsonLd(metadata: PageMetadata, primaryHeading: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: primaryHeading,
    description: metadata.description,
    url: metadata.canonical,
  };
}

export function buildFaqJsonLd(_seo: SeoMetadata) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [],
  };
}

export function buildStructuredData(
  templates: string[] | undefined,
  metadata: PageMetadata,
  seo: SeoMetadata,
  siteSettings: SiteSettings,
) {
  const blocks: object[] = [];
  for (const template of templates ?? []) {
    if (template === 'organization') blocks.push(buildOrganizationJsonLd(siteSettings));
    if (template === 'web_page') blocks.push(buildWebPageJsonLd(metadata, seo.primary_heading));
    if (template === 'faq') blocks.push(buildFaqJsonLd(seo));
  }
  return blocks;
}
