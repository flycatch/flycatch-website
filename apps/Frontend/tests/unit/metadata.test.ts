import { describe, expect, it } from 'vitest';
import { t } from '../../src/lib/i18n';
import {
  metadataFallbackForPath,
  metadataFromBlog,
  metadataFromCaseStudy,
  metadataFromContentSeo,
} from '../../src/lib/metadata';
import type { ContentSeo, PublicCaseStudy } from '../../src/lib/public-api';

const emptySeo: ContentSeo = {
  title: '',
  description: '',
  canonical_url: '',
  meta_title: '',
  h1_tag: '',
  image_alt: '',
  image_key: null,
};

const siteSettings = {
  site_name: 'Flycatch',
  default_locale: 'en',
  locale_url_strategy: 'unprefixed_default',
  robots_policy: 'index_public',
  default_social_image_key: null,
  canonical_origin: 'https://www.flycatchtech.com',
};

describe('template metadata fallbacks', () => {
  it('never uses the site name when CMS SEO fields are empty', () => {
    const fallback = metadataFallbackForPath('/services/ai-services');
    const metadata = metadataFromContentSeo(emptySeo, siteSettings, fallback);
    expect(metadata.title).toBe(t('page.services.slug.ai-services'));
    expect(metadata.description).toBe(t('page.services.description'));
    expect(metadata.title).not.toBe(siteSettings.site_name);
    expect(metadata.description).not.toBe(siteSettings.site_name);
  });

  it('uses CMS SEO when present', () => {
    const metadata = metadataFromContentSeo(
      { ...emptySeo, meta_title: 'Custom title', description: 'Custom description' },
      siteSettings,
      metadataFallbackForPath('/'),
    );
    expect(metadata.title).toBe('Custom title');
    expect(metadata.description).toBe('Custom description');
  });

  it('falls blog and case-study metadata back to the template, not the site name', () => {
    const blog = metadataFromBlog(
      {
        title: '',
        description: '',
        canonical_url: '',
        image_key: null,
        seo: emptySeo,
      },
      siteSettings,
      '/company/blogs/example',
    );
    expect(blog.title).toBe(t('nav.blogs'));
    expect(blog.description).toBe(t('page.blog.description'));
    expect(blog.description).not.toBe('Flycatch');

    const study = metadataFromCaseStudy(
      {
        heading: '',
        slug: 'example',
        short_heading: '',
        description: '',
        order: 0,
        date: null,
        image_key: null,
        image_alt: '',
        industries: [],
        categories: [],
        technologies: [],
        body: '',
        content_available_in: [],
        seo: emptySeo,
      } as PublicCaseStudy,
      siteSettings,
      '/case-studies/example',
    );
    expect(study.title).toBe(t('nav.case_studies'));
    expect(study.description).toBe(t('page.case_studies.description'));
  });
});
