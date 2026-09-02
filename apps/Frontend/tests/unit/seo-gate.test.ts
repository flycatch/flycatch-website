import { describe, expect, it } from 'vitest';
import { buildPageMetadata, documentTitleFromSeo } from '../../src/lib/metadata';

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
    expect(metadata.socialImageUrl).toBeNull();
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
