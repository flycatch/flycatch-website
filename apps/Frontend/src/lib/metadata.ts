import { t } from './i18n';
import type { SeoMetadata, SiteSettings } from './published-snapshot';
import type { ContentSeo, PublicCaseStudy, PublicHome } from './public-api';
import { absoluteMediaUrl, apiOrigin } from './public-api';
import { getSiteSettings } from './published-snapshot';
import { resolveRoute, type PageKind } from './route-registry';
import { resolveSocialImageUrl, socialTitleWithoutDuplicateBrand } from './seo';

export function publicSiteSettings(): SiteSettings {
  return {
    ...getSiteSettings(),
    canonical_origin: apiOrigin(),
  };
}

const CMS_PLACEHOLDER = 'This section will appear when published content is available.';

export function fallbackMetadata(path: string, title: string, description: string): PageMetadata {
  const origin = apiOrigin();
  const safeDescription = description === CMS_PLACEHOLDER ? title : description;
  return {
    title,
    description: safeDescription,
    canonical: buildCanonicalUrl(origin, path),
    socialTitle: socialTitleWithoutDuplicateBrand(title),
    socialDescription: safeDescription,
    socialImageKey: null,
    socialImageUrl: resolveSocialImageUrl(origin, null),
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
    socialTitle: socialTitleWithoutDuplicateBrand(seo.social_title ?? seo.title),
    socialDescription: seo.social_description ?? seo.description,
    socialImageKey,
    socialImageUrl: resolveSocialImageUrl(
      siteSettings.canonical_origin,
      absoluteMediaUrl(siteSettings.canonical_origin, socialImageKey),
    ),
    indexable: seo.indexable,
  };
}

export type MetadataFallback = {
  title: string;
  description: string;
};

const PAGE_DESCRIPTION_KEYS: Record<PageKind, string> = {
  home: 'page.home.summary',
  service_index: 'page.services.description',
  service: 'page.services.description',
  solution_index: 'page.solutions.description',
  solution: 'page.solutions.description',
  case_study_index: 'page.case_studies.description',
  case_study: 'page.case_studies.description',
  about: 'page.about.summary',
  blog_index: 'page.blog.description',
  blog: 'page.blog.description',
  careers: 'page.careers.description',
  job_index: 'page.jobs.description',
  job: 'page.jobs.description',
  clients: 'page.clients.description',
  testimonials: 'page.stories.description',
  resource_index: 'page.resources.description',
  resource: 'page.resources.description',
  memberships: 'page.memberships.description',
  news_index: 'page.news.description',
  news: 'page.news.description',
  contact: 'page.contact.description',
  saudi: 'page.saudi.description',
  privacy: 'page.privacy.description',
  terms: 'page.terms.description',
};

export function metadataFallbackForPath(path: string, titleOverride?: string): MetadataFallback {
  const route = resolveRoute(path);
  const title = titleOverride?.trim() || (route ? t(route.labelKey) : t('page.not_found.title'));
  const description = route ? t(PAGE_DESCRIPTION_KEYS[route.pageKind]) : t('page.not_found.body');
  return { title, description };
}

function usableText(value: string | null | undefined): string {
  const text = value?.trim() ?? '';
  if (!text || text === CMS_PLACEHOLDER) return '';
  return text;
}

export function documentTitleFromSeo(
  seo: Pick<ContentSeo, 'meta_title' | 'title'> | null | undefined,
  fallbackPageName: string,
): string {
  const metaTitle = usableText(seo?.meta_title);
  if (metaTitle) return metaTitle;
  const seoTitle = usableText(seo?.title);
  if (seoTitle) return seoTitle;
  return fallbackPageName;
}

function asFallback(fallback: MetadataFallback | string): MetadataFallback {
  if (typeof fallback === 'string') {
    const fromPath = fallback.startsWith('/') ? metadataFallbackForPath(fallback) : null;
    if (fromPath) return fromPath;
    return { title: fallback, description: fallback };
  }
  return fallback;
}

export function metadataFromContentSeo(
  seo: ContentSeo,
  siteSettings: SiteSettings,
  fallback: MetadataFallback | string,
): PageMetadata {
  const template = asFallback(fallback);
  const title = documentTitleFromSeo(seo, template.title);
  const description = usableText(seo.description) || template.description;
  const canonical =
    seo.canonical_url.startsWith('http://') || seo.canonical_url.startsWith('https://')
      ? seo.canonical_url
      : buildCanonicalUrl(siteSettings.canonical_origin, seo.canonical_url || '/');
  const socialImageKey = seo.image_key ?? siteSettings.default_social_image_key ?? null;
  return {
    title,
    description,
    canonical,
    socialTitle: socialTitleWithoutDuplicateBrand(usableText(seo.title) || title),
    socialDescription: description,
    socialImageKey,
    socialImageUrl: resolveSocialImageUrl(
      siteSettings.canonical_origin,
      absoluteMediaUrl(siteSettings.canonical_origin, socialImageKey),
    ),
    indexable: true,
  };
}

export function metadataFromBlog(
  blog: {
    title: string;
    description: string;
    canonical_url: string;
    image_key: string | null;
    seo?: ContentSeo;
  },
  siteSettings: SiteSettings,
  path: string,
): PageMetadata {
  const template = metadataFallbackForPath(path, blog.title);
  const fromSeo = blog.seo
    ? metadataFromContentSeo(blog.seo, siteSettings, {
        title: usableText(blog.title) || template.title,
        description: usableText(blog.description) || template.description,
      })
    : null;
  const canonical =
    blog.canonical_url.startsWith('http://') || blog.canonical_url.startsWith('https://')
      ? blog.canonical_url
      : buildCanonicalUrl(siteSettings.canonical_origin, path);
  return {
    title: fromSeo?.title || usableText(blog.title) || template.title,
    description: fromSeo?.description || usableText(blog.description) || template.description,
    canonical,
    socialTitle: socialTitleWithoutDuplicateBrand(
      fromSeo?.socialTitle || usableText(blog.title) || template.title,
    ),
    socialDescription: fromSeo?.socialDescription || usableText(blog.description) || template.description,
    socialImageKey: fromSeo?.socialImageKey || blog.image_key,
    socialImageUrl: resolveSocialImageUrl(
      siteSettings.canonical_origin,
      fromSeo?.socialImageUrl || absoluteMediaUrl(siteSettings.canonical_origin, blog.image_key),
    ),
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
  const faqEntities = home.faqs
    .filter((faq) => faq.title && faq.contents)
    .map((faq) => ({
      '@type': 'Question',
      name: faq.title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.contents,
      },
    }));
  if (faqEntities.length) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqEntities,
    });
  }
  return blocks;
}

export function metadataFromCaseStudy(
  study: PublicCaseStudy,
  siteSettings: SiteSettings,
  path: string,
): PageMetadata {
  const template = metadataFallbackForPath(path, study.heading);
  const fromSeo = metadataFromContentSeo(study.seo, siteSettings, {
    title: usableText(study.heading) || template.title,
    description: usableText(study.description) || usableText(study.short_heading) || template.description,
  });
  return {
    ...fromSeo,
    canonical: buildCanonicalUrl(siteSettings.canonical_origin, path),
    socialImageKey: fromSeo.socialImageKey || study.image_key,
    socialImageUrl: resolveSocialImageUrl(
      siteSettings.canonical_origin,
      fromSeo.socialImageUrl || absoluteMediaUrl(siteSettings.canonical_origin, study.image_key),
    ),
  };
}
