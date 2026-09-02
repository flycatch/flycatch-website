import { describe, expect, it } from 'vitest';
import { buildPageMetadata } from '../../src/lib/metadata';

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
});
