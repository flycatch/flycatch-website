import type { PageMetadata } from './metadata';
import type { PublicBlogDetail, PublicCaseStudy } from './public-api';
import type { SeoMetadata, SiteSettings } from './published-snapshot';
import { absoluteMediaUrl } from './public-api';

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

export function caseStudyStructuredData(
  study: PublicCaseStudy,
  metadata: PageMetadata,
  siteSettings: SiteSettings,
) {
  return [
    buildOrganizationJsonLd(siteSettings),
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: study.heading,
      description: study.description,
      url: metadata.canonical,
      image: absoluteMediaUrl(siteSettings.canonical_origin, study.image_key) ?? undefined,
    },
  ];
}

export function blogStructuredData(
  blog: PublicBlogDetail,
  metadata: PageMetadata,
  siteSettings: SiteSettings,
) {
  return [
    buildOrganizationJsonLd(siteSettings),
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: blog.title,
      description: blog.description,
      url: metadata.canonical,
      image: absoluteMediaUrl(siteSettings.canonical_origin, blog.image_key) ?? undefined,
      author: blog.authors.map((author) => ({
        '@type': 'Person',
        name: author.name,
        jobTitle: author.designation,
      })),
      timeRequired: `PT${Math.max(blog.reading_time, 1)}M`,
    },
  ];
}
