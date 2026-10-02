import { describe, expect, it } from 'vitest';
import {
  buildPageMetadata,
  documentTitleFromSeo,
  metadataFromContentSeo,
  resolvePublicCanonical,
} from '../../src/lib/metadata';

describe('seo metadata helper', () => {
  it('builds canonical URL from site settings', () => {
    const metadata = buildPageMetadata(
      {
        title: 'Test',
        description: 'Desc',
        canonical_path: '/',
        indexable: true,
        primary_heading: 'Heading',
        summary: 'Summary',
      },
      {
        site_name: 'Flycatch',
        default_locale: 'en',
        locale_url_strategy: 'unprefixed_default',
        robots_policy: 'index_public',
        canonical_origin: 'http://localhost:8080',
      },
    );
    expect(metadata.canonical).toBe('http://localhost:8080/');
    expect(metadata.socialImageUrl).toBe('http://localhost:8080/og-default.png');
  });

  it('prefers a page social image, then the site default', () => {
    const settings = {
      site_name: 'Flycatch',
      default_locale: 'en',
      locale_url_strategy: 'unprefixed_default',
      robots_policy: 'index_public',
      canonical_origin: 'https://www.flycatchtech.com',
      default_social_image_key: 'site-share',
    };
    const page = {
      title: 'Test',
      description: 'Desc',
      canonical_path: '/services',
      indexable: true,
      primary_heading: 'Heading',
      summary: 'Summary',
    };
    expect(buildPageMetadata(page, settings).socialImageUrl).toBe(
      'https://www.flycatchtech.com/api/v1/public/media/site-share',
    );
    expect(
      buildPageMetadata(
        { ...page, social_image_key: 'page-share' },
        settings,
      ).socialImageUrl,
    ).toBe('https://www.flycatchtech.com/api/v1/public/media/page-share');
    expect(
      buildPageMetadata(page, { ...settings, default_social_image_key: '  ' }).socialImageUrl,
    ).toBe('https://www.flycatchtech.com/og-default.png');
  });

  it('prefers SEO meta title then page name', () => {
    expect(
      documentTitleFromSeo({ meta_title: 'Home SEO', title: 'Ignored' }, 'Home'),
    ).toBe('Home SEO');
    expect(documentTitleFromSeo({ meta_title: '', title: 'About Us' }, 'About Us')).toBe(
      'About Us',
    );
    expect(documentTitleFromSeo({ meta_title: '', title: '' }, 'Case Studies')).toBe(
      'Case Studies',
    );
  });
});

describe('resolvePublicCanonical', () => {
  const origin = 'https://www.flycatchtech.com';

  it('strips /en prefix when CMS path matches the live path', () => {
    expect(
      resolvePublicCanonical(origin, '/services', 'https://flycatchtech.com/en/services'),
    ).toBe('https://www.flycatchtech.com/services');
  });

  it('ignores mismatched membership singular CMS path', () => {
    expect(
      resolvePublicCanonical(
        origin,
        '/company/memberships',
        'https://www.flycatchtech.com/en/company/membership',
      ),
    ).toBe('https://www.flycatchtech.com/company/memberships');
  });

  it('falls back to live path when CMS canonical is empty', () => {
    expect(resolvePublicCanonical(origin, '/solutions', '')).toBe(
      'https://www.flycatchtech.com/solutions',
    );
    expect(resolvePublicCanonical(origin, '/services/ai-services', null)).toBe(
      'https://www.flycatchtech.com/services/ai-services',
    );
  });

  it('never canonicalizes a non-home page to the homepage', () => {
    expect(resolvePublicCanonical(origin, '/services/ai-services', '/')).toBe(
      'https://www.flycatchtech.com/services/ai-services',
    );
    expect(
      resolvePublicCanonical(origin, '/services/ai-services', 'https://www.flycatchtech.com/'),
    ).toBe('https://www.flycatchtech.com/services/ai-services');
  });

  it('accepts a matching relative CMS path', () => {
    expect(resolvePublicCanonical(origin, '/contact-us', '/contact-us')).toBe(
      'https://www.flycatchtech.com/contact-us',
    );
  });

  it('uses live path in metadataFromContentSeo when CMS has /en', () => {
    const metadata = metadataFromContentSeo(
      {
        title: 'Services',
        description: 'Desc',
        canonical_url: 'https://flycatchtech.com/en/services',
        meta_title: '',
        h1_tag: '',
        image_alt: '',
        image_key: null,
      },
      {
        site_name: 'Flycatch',
        default_locale: 'en',
        locale_url_strategy: 'unprefixed_default',
        robots_policy: 'index_public',
        canonical_origin: origin,
      },
      '/services',
      'Services',
    );
    expect(metadata.canonical).toBe('https://www.flycatchtech.com/services');
    expect(metadata.socialImageUrl).toBe('https://www.flycatchtech.com/og-default.png');
  });
});
