import type { PageMetadata } from './metadata';
import type { PublicBlogDetail, PublicCaseStudy, PublicNews, PublicOpening } from './public-api';
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

export function newsStructuredData(
  news: PublicNews,
  metadata: PageMetadata,
  siteSettings: SiteSettings,
) {
  const imageKey = news.seo?.image_key || news.image_key;
  return [
    buildOrganizationJsonLd(siteSettings),
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: news.title,
      description: metadata.description,
      url: metadata.canonical,
      datePublished: news.created_at,
      image: absoluteMediaUrl(siteSettings.canonical_origin, imageKey) ?? undefined,
      author: (news.authors ?? []).map((author) => ({
        '@type': 'Person',
        name: author.name,
        jobTitle: author.designation,
      })),
      timeRequired: `PT${Math.max(news.reading_time, 1)}M`,
    },
  ];
}

const SCHEMA_EMPLOYMENT: Record<string, string> = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
  temporary: 'TEMPORARY',
};

export function openingStructuredData(
  opening: PublicOpening,
  metadata: PageMetadata,
  siteSettings: SiteSettings,
) {
  const source = opening.careers;
  const employmentType =
    SCHEMA_EMPLOYMENT[opening.job_type.trim().toLowerCase()] ?? opening.job_type;
  const places = source?.locations?.length
    ? source.locations.map((place) => ({
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: place.label,
          ...((place.country || source.country) ? { addressCountry: place.country || source.country } : {}),
        },
      }))
    : [{ '@type': 'Place', address: opening.location }];
  return [
    buildOrganizationJsonLd(siteSettings),
    {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: opening.role,
      description: opening.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || opening.role,
      url: metadata.canonical,
      employmentType,
      jobLocation: places.length === 1 ? places[0] : places,
      ...(source?.workMode === 'Remote' ? { jobLocationType: 'TELECOMMUTE' } : {}),
      hiringOrganization: {
        '@type': 'Organization',
        name: source?.organisation || siteSettings.site_name,
        url: siteSettings.canonical_origin,
      },
      ...(source?.datePosted ? { datePosted: source.datePosted } : {}),
      validThrough: opening.exp_date ?? undefined,
      identifier: opening.job_id,
    },
  ];
}
