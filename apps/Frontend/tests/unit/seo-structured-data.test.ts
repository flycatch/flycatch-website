import { describe, expect, it } from 'vitest';
import { breadcrumbTrail } from '../../src/lib/breadcrumbs';
import {
  blogStructuredData,
  composeStructuredData,
  hasJsonLdType,
  isUsableFaqPage,
} from '../../src/lib/json-ld';
import { listingPageHref, paginate, parsePageParam } from '../../src/lib/pagination';
import { absoluteSitemapUrl, buildRobotsTxt, htmlRobotsTag } from '../../src/lib/robots';
import { brandNameCount, socialTitleWithoutDuplicateBrand } from '../../src/lib/seo';
import { mergeSitemapPaths, renderUrlSetXml, sitemapHasDuplicateLocs } from '../../src/lib/sitemap';
import type { PageMetadata } from '../../src/lib/metadata';
import type { PublicBlogDetail } from '../../src/lib/public-api';

const siteSettings = {
  site_name: 'Flycatch',
  default_locale: 'en',
  locale_url_strategy: 'unprefixed_default',
  robots_policy: 'index_public',
  canonical_origin: 'https://www.flycatchtech.com',
};

const metadata: PageMetadata = {
  title: 'AI Services',
  description: 'Service description',
  canonical: 'https://www.flycatchtech.com/services/ai-services',
  socialTitle: 'AI Services',
  socialDescription: 'Service description',
  socialImageKey: null,
  socialImageUrl: 'https://www.flycatchtech.com/opengraph-image.jpg',
  indexable: true,
};

describe('social titles', () => {
  it('keeps the brand name at most once', () => {
    expect(socialTitleWithoutDuplicateBrand('Flycatch | Flycatch')).toBe('Flycatch');
    expect(socialTitleWithoutDuplicateBrand('About Flycatch | Flycatch')).toBe('About Flycatch');
    expect(brandNameCount(socialTitleWithoutDuplicateBrand('About | Flycatch | Flycatch'))).toBe(1);
  });
});

describe('structured data composition', () => {
  it('emits Organization with sameAs and WebSite on every page', () => {
    const blocks = composeStructuredData({
      pathname: '/contact-us',
      metadata: { ...metadata, canonical: 'https://www.flycatchtech.com/contact-us' },
      siteSettings,
    });
    const types = blocks.flatMap((block) =>
      Array.isArray((block as { '@type': string | string[] })['@type'])
        ? ((block as { '@type': string[] })['@type'])
        : [(block as { '@type': string })['@type']],
    );
    expect(types).toContain('Organization');
    expect(types).toContain('WebSite');
    const organization = blocks.find((block) => hasJsonLdType(block, 'Organization')) as {
      sameAs: string[];
    };
    expect(organization.sameAs.length).toBeGreaterThan(0);
  });

  it('emits Service markup for service pages', () => {
    const blocks = composeStructuredData({
      pathname: '/services/ai-services',
      metadata,
      siteSettings,
    });
    expect(blocks.some((block) => hasJsonLdType(block, 'Service'))).toBe(true);
  });

  it('emits BlogPosting with headline, date, and author', () => {
    const blog: PublicBlogDetail = {
      title: 'Kubernetes guide',
      slug: 'how-kubernetes-help-your-growing-business',
      description: 'Body',
      body: '<p>Hi</p>',
      reading_time: 4,
      created_at: '2024-01-02T00:00:00Z',
      image_key: null,
      image_alt: '',
      canonical_url: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      content_available_in: ['en'],
      authors: [{ name: 'Ada', designation: 'Writer', writer_image_keys: [] }],
      categories: [],
      seo: {
        title: '',
        description: '',
        canonical_url: '',
        meta_title: '',
        h1_tag: '',
        image_alt: '',
        image_key: null,
      },
    };
    const [block] = blogStructuredData(blog, metadata, siteSettings);
    expect(block).toMatchObject({
      '@type': 'BlogPosting',
      headline: 'Kubernetes guide',
      datePublished: '2024-01-02T00:00:00Z',
      author: [{ '@type': 'Person', name: 'Ada' }],
    });
  });

  it('drops FAQPage blocks with an empty mainEntity', () => {
    expect(isUsableFaqPage({ '@type': 'FAQPage', mainEntity: [] })).toBe(false);
    const blocks = composeStructuredData({
      pathname: '/',
      metadata: { ...metadata, canonical: 'https://www.flycatchtech.com/' },
      siteSettings,
      extra: [{ '@type': 'FAQPage', mainEntity: [] }],
    });
    expect(blocks.some((block) => hasJsonLdType(block, 'FAQPage'))).toBe(false);
  });
});

describe('breadcrumbs', () => {
  it('builds a visible trail for pages below the top level', () => {
    const trail = breadcrumbTrail('/services/ai-services', 'AI Services');
    expect(trail.map((item) => item.path)).toEqual(['/', '/services', '/services/ai-services']);
    expect(trail.at(-1)?.label).toBe('AI Services');
  });

  it('does not require a trail on the home page', () => {
    expect(breadcrumbTrail('/')).toEqual([]);
  });
});

describe('sitemap generation', () => {
  it('builds one loc per path without slashed duplicates', () => {
    const paths = mergeSitemapPaths(['/contact-us', '/contact-us/', '/company/blogs'], [
      '/company/blogs/how-kubernetes-help-your-growing-business',
    ]);
    const xml = renderUrlSetXml('https://www.flycatchtech.com', paths);
    expect(sitemapHasDuplicateLocs(xml)).toBe(false);
    expect(xml).toContain('https://www.flycatchtech.com/contact-us');
    expect(xml).not.toContain('https://www.flycatchtech.com/contact-us/');
  });
});

describe('robots and indexability', () => {
  it('allows crawl on production and names the absolute sitemap', () => {
    const body = buildRobotsTxt(true, absoluteSitemapUrl('https://www.flycatchtech.com'));
    expect(body).toContain('Allow: /');
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Sitemap: https://www.flycatchtech.com/sitemap.xml');
    expect(htmlRobotsTag('production')).toBeNull();
  });

  it('disallows crawl outside production', () => {
    expect(buildRobotsTxt(false, 'https://example.test/sitemap.xml')).toContain('Disallow: /');
    expect(htmlRobotsTag('development')).toBe('noindex, nofollow');
  });
});

describe('listing pagination', () => {
  it('exposes crawlable page links to later items', () => {
    const items = Array.from({ length: 25 }, (_, index) => index + 1);
    const first = paginate(items, parsePageParam('1'), 12);
    const last = paginate(items, parsePageParam('3'), 12);
    expect(first.items).toEqual(items.slice(0, 12));
    expect(last.items).toEqual(items.slice(24));
    expect(listingPageHref('/company/blogs', 3)).toBe('/company/blogs?page=3');
  });
});
