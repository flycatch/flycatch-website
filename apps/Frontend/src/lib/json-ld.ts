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

export function openingStructuredData(
  opening: PublicOpening,
  metadata: PageMetadata,
  siteSettings: SiteSettings,
) {
  return [
    buildOrganizationJsonLd(siteSettings),
    {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: opening.role,
      description: opening.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || opening.role,
      url: metadata.canonical,
      employmentType: opening.job_type,
      jobLocation: {
        '@type': 'Place',
        address: opening.location,
      },
      hiringOrganization: {
        '@type': 'Organization',
        name: siteSettings.site_name,
        url: siteSettings.canonical_origin,
      },
      validThrough: opening.exp_date ?? undefined,
      identifier: opening.job_id,
    },
  ];
}
