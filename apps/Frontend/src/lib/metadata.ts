import type { SeoMetadata, SiteSettings } from './published-snapshot';
import type { ContentSeo, PublicCaseStudy, PublicHome } from './public-api';
import { absoluteMediaUrl, apiOrigin } from './public-api';
import { getSiteSettings } from './published-snapshot';

export function publicSiteSettings(): SiteSettings {
  return {
    ...getSiteSettings(),
    canonical_origin: apiOrigin(),
  };
}

export function fallbackMetadata(path: string, title: string, description: string): PageMetadata {
  const origin = apiOrigin();
  return {
    title,
    description,
    canonical: buildCanonicalUrl(origin, path),
    socialTitle: title,
    socialDescription: description,
    socialImageKey: null,
    socialImageUrl: null,
    indexable: false,
  };
}

export interface PageMetadata {
  title: string;
  description: string;
  canonical: string;
  socialTitle: string;
  socialDescription: string;
  socialImageKey: string | null;
  socialImageUrl: string | null;
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
  const socialImageKey = seo.social_image_key ?? siteSettings.default_social_image_key ?? null;
  return {
    title: seo.title,
    description: seo.description,
    canonical: buildCanonicalUrl(siteSettings.canonical_origin, seo.canonical_path),
    socialTitle: seo.social_title ?? seo.title,
    socialDescription: seo.social_description ?? seo.description,
    socialImageKey,
    socialImageUrl: absoluteMediaUrl(siteSettings.canonical_origin, socialImageKey),
    indexable: seo.indexable,
  };
}

export function documentTitleFromSeo(
  seo: Pick<ContentSeo, 'meta_title' | 'title'> | null | undefined,
  fallbackPageName: string,
): string {
  const metaTitle = seo?.meta_title?.trim();
  if (metaTitle) return metaTitle;
  const seoTitle = seo?.title?.trim();
  if (seoTitle) return seoTitle;
  return fallbackPageName;
}

export function metadataFromContentSeo(
  seo: ContentSeo,
  siteSettings: SiteSettings,
  fallbackPageName = siteSettings.site_name,
): PageMetadata {
  const title = documentTitleFromSeo(seo, fallbackPageName);
  const description = seo.description.trim() || siteSettings.site_name;
  const canonical =
    seo.canonical_url.startsWith('http://') || seo.canonical_url.startsWith('https://')
      ? seo.canonical_url
      : buildCanonicalUrl(siteSettings.canonical_origin, seo.canonical_url || '/');
  const socialImageKey = seo.image_key ?? siteSettings.default_social_image_key ?? null;
  return {
    title,
    description,
    canonical,
    socialTitle: seo.title.trim() || title,
    socialDescription: description,
    socialImageKey,
    socialImageUrl: absoluteMediaUrl(siteSettings.canonical_origin, socialImageKey),
    indexable: true,
  };
}

export function metadataFromBlog(
  blog: {
    title: string;
    description: string;
    canonical_url: string;
    image_key: string | null;
  },
  siteSettings: SiteSettings,
  path: string,
): PageMetadata {
  const canonical =
    blog.canonical_url.startsWith('http://') || blog.canonical_url.startsWith('https://')
      ? blog.canonical_url
      : buildCanonicalUrl(siteSettings.canonical_origin, path);
  return {
    title: blog.title.trim() || siteSettings.site_name,
    description: blog.description.trim() || siteSettings.site_name,
    canonical,
    socialTitle: blog.title.trim() || siteSettings.site_name,
    socialDescription: blog.description.trim() || siteSettings.site_name,
    socialImageKey: blog.image_key,
    socialImageUrl: absoluteMediaUrl(siteSettings.canonical_origin, blog.image_key),
    indexable: true,
  };
}

export function homeStructuredData(
  home: PublicHome,
  metadata: PageMetadata,
  siteSettings: SiteSettings,
) {
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

export function metadataFromCaseStudy(
  study: PublicCaseStudy,
  siteSettings: SiteSettings,
  path: string,
): PageMetadata {
  return {
    title: study.heading.trim() || siteSettings.site_name,
    description: study.description.trim() || study.short_heading || siteSettings.site_name,
    canonical: buildCanonicalUrl(siteSettings.canonical_origin, path),
    socialTitle: study.heading.trim() || siteSettings.site_name,
    socialDescription: study.description.trim() || siteSettings.site_name,
    socialImageKey: study.image_key,
    socialImageUrl: absoluteMediaUrl(siteSettings.canonical_origin, study.image_key),
    indexable: true,
  };
}
