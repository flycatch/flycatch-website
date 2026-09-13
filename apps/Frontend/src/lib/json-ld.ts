import { breadcrumbAbsoluteItems } from './breadcrumbs';
import type { PageMetadata } from './metadata';
import { socialLinks } from './nav';
import type { PublicBlogDetail, PublicCaseStudy } from './public-api';
import type { SiteSettings } from './published-snapshot';
import { absoluteMediaUrl } from './public-api';
import { resolveRoute } from './route-registry';

export function jsonLdTypes(block: object): string[] {
  const type = (block as { '@type'?: string | string[] })['@type'];
  if (Array.isArray(type)) return type;
  return type ? [type] : [];
}

export function hasJsonLdType(block: object, type: string): boolean {
  return jsonLdTypes(block).includes(type);
}

export function isUsableFaqPage(block: object): boolean {
  if (!hasJsonLdType(block, 'FAQPage')) return true;
  const entity = (block as { mainEntity?: unknown }).mainEntity;
  return Array.isArray(entity) && entity.length > 0;
}

export function buildOrganizationJsonLd(siteSettings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteSettings.site_name,
    url: siteSettings.canonical_origin,
    sameAs: socialLinks.map((link) => link.href),
  };
}

export function buildWebSiteJsonLd(siteSettings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
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

export function buildServiceJsonLd(metadata: PageMetadata, siteSettings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: metadata.title,
    description: metadata.description,
    url: metadata.canonical,
    provider: {
      '@type': 'Organization',
      name: siteSettings.site_name,
      url: siteSettings.canonical_origin,
    },
  };
}

export function buildBreadcrumbListJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function caseStudyStructuredData(
  study: PublicCaseStudy,
  metadata: PageMetadata,
  siteSettings: SiteSettings,
) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: study.heading,
      description: study.description,
      url: metadata.canonical,
      datePublished: study.date || undefined,
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
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: blog.title,
      description: blog.description,
      url: metadata.canonical,
      datePublished: blog.created_at || undefined,
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

export function composeStructuredData(options: {
  pathname: string;
  metadata: PageMetadata;
  siteSettings: SiteSettings;
  extra?: object[];
  breadcrumbCurrentLabel?: string;
}): object[] {
  const extras = (options.extra ?? []).filter(isUsableFaqPage);
  const pageSpecific = extras.filter(
    (block) =>
      !hasJsonLdType(block, 'Organization') &&
      !hasJsonLdType(block, 'WebSite') &&
      !hasJsonLdType(block, 'BreadcrumbList'),
  );
  const extraTypes = new Set(pageSpecific.flatMap(jsonLdTypes));
  const blocks: object[] = [
    buildOrganizationJsonLd(options.siteSettings),
    buildWebSiteJsonLd(options.siteSettings),
  ];
  const route = resolveRoute(options.pathname);
  if (route && !extraTypes.has(route.structuredDataType)) {
    if (route.structuredDataType === 'Service') {
      blocks.push(buildServiceJsonLd(options.metadata, options.siteSettings));
    } else if (route.structuredDataType === 'WebPage') {
      blocks.push(buildWebPageJsonLd(options.metadata, options.metadata.title));
    }
  }
  if (route && route.ancestors.length > 0) {
    blocks.push(
      buildBreadcrumbListJsonLd(
        breadcrumbAbsoluteItems(
          options.pathname,
          options.siteSettings.canonical_origin,
          options.breadcrumbCurrentLabel,
        ),
      ),
    );
  }
  return [...blocks, ...pageSpecific];
}
