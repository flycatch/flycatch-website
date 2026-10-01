import { describe, expect, it } from 'vitest';
import { redirectTarget, rewritePublicHref, rewritePublicHrefs } from '../../src/lib/seo-redirects';

describe('seo redirects', () => {
  it('strips /en locale prefix', () => {
    expect(redirectTarget('/en')).toBe('/');
    expect(redirectTarget('/en/')).toBe('/');
    expect(redirectTarget('/en/services')).toBe('/services');
    expect(redirectTarget('/en/company/blogs/example')).toBe('/company/blogs/example');
  });

  it('maps legacy and duplicate paths', () => {
    expect(redirectTarget('/about')).toBe('/company/about-us');
    expect(redirectTarget('/about-us')).toBe('/company/about-us');
    expect(redirectTarget('/company/membership')).toBe('/company/memberships');
    expect(redirectTarget('/blogs/my-post')).toBe('/company/blogs/my-post');
    expect(redirectTarget('/services/data-management')).toBe('/services/data-migration');
    expect(redirectTarget('/services/data-management-strategy')).toBe('/services/data-migration');
    expect(redirectTarget('/services/data-engineering')).toBe('/services/data-migration');
    expect(redirectTarget('/services/big-data-analytics')).toBe('/services/data-migration');
    expect(redirectTarget('/services/visualization-and-intelligence')).toBe(
      '/services/data-migration',
    );
    expect(redirectTarget('/services/ai-services/agentic-ai')).toBe('/services/ai-services');
    expect(redirectTarget('/application-development')).toBe(
      '/services/application-development-services',
    );
    expect(redirectTarget('/solutions/combus')).toBe('/solutions/com-bus');
    expect(redirectTarget('/services/data-migration')).toBeNull();
    expect(redirectTarget('/services/ai-services')).toBeNull();
    expect(redirectTarget('/services/application-development-services')).toBeNull();
  });

  it('normalizes lowercase AI solution slugs to sitemap camelCase', () => {
    expect(redirectTarget('/solutions/flygrid-ai')).toBe('/solutions/flyGrid-ai');
    expect(redirectTarget('/solutions/doctcare-ai')).toBe('/solutions/doctCare-ai');
    expect(redirectTarget('/solutions/docsis-ai')).toBe('/solutions/docSis-ai');
    expect(redirectTarget('/solutions/talkshop-ai')).toBe('/solutions/talkShop-ai');
    expect(redirectTarget('/solutions/flyGrid-ai')).toBeNull();
    expect(redirectTarget('/solutions/credit-life')).toBeNull();
    expect(redirectTarget('/solutions/com-bus')).toBeNull();
  });

  it('redirects the truncated cloud-migration blog slug', () => {
    const long =
      '/company/blogs/explore-practical-cloud-migration-strategies-that-enhance-scalability-security-and-performance-learn-how-to-plan-execute-and-optimize-your-move-to-the-cloud';
    const short =
      '/company/blogs/explore-practical-cloud-migration-strategies-that-enhance-scalability-security-and-performance-learn-how-to-plan-execute-and-opt';
    expect(redirectTarget(long)).toBe(short);
    expect(redirectTarget(short)).toBeNull();
  });

  it('composes /en stripping with legacy maps in one hop', () => {
    expect(redirectTarget('/en/company/membership')).toBe('/company/memberships');
    expect(redirectTarget('/en/company/membership/')).toBe('/company/memberships');
    expect(redirectTarget('/en/solutions/flygrid-ai/')).toBe('/solutions/flyGrid-ai');
    expect(redirectTarget('/en/about-us')).toBe('/company/about-us');
    expect(redirectTarget('/en/services/data-management')).toBe('/services/data-migration');
    expect(redirectTarget('/en/services/data-engineering')).toBe('/services/data-migration');
    expect(redirectTarget('/en/services/ai-services/agentic-ai/')).toBe('/services/ai-services');
  });

  it('maps /en catch-all paths used by en/[...slug]', () => {
    expect(redirectTarget('/en/contact-us')).toBe('/contact-us');
    expect(redirectTarget('/en/company/blogs/example')).toBe('/company/blogs/example');
  });

  it('strips trailing slashes and skips admin/api', () => {
    expect(redirectTarget('/services/')).toBe('/services');
    expect(redirectTarget('/')).toBeNull();
    expect(redirectTarget('/admin/blogs')).toBeNull();
    expect(redirectTarget('/api/v1/public/blogs')).toBeNull();
  });

  it('rewrites the Ahrefs broken blog hrefs to live service paths', () => {
    expect(rewritePublicHref('/en/services/ai-services/agentic-ai')).toBe('/services/ai-services');
    expect(rewritePublicHref('/en/services/big-data-analytics')).toBe('/services/data-migration');
    expect(rewritePublicHref('/en/services/data-engineering')).toBe('/services/data-migration');
    expect(rewritePublicHref('/en/services/data-management-strategy')).toBe(
      '/services/data-migration',
    );
    expect(rewritePublicHref('/application-development')).toBe(
      '/services/application-development-services',
    );
    expect(
      rewritePublicHref('https://www.flycatchtech.com/en/services/big-data-analytics'),
    ).toBe('https://www.flycatchtech.com/services/data-migration');
    expect(rewritePublicHref('https://example.com/en/services/big-data-analytics')).toBe(
      'https://example.com/en/services/big-data-analytics',
    );
    expect(rewritePublicHref('mailto:hello@flycatchtech.com')).toBe('mailto:hello@flycatchtech.com');
    expect(rewritePublicHref('/services/data-migration')).toBe('/services/data-migration');
  });

  it('rewrites href attributes in CMS HTML', () => {
    const html =
      '<p><a href="/en/services/big-data-analytics">data analytics</a> and ' +
      "<a href='https://www.flycatchtech.com/application-development'>apps</a></p>";
    expect(rewritePublicHrefs(html)).toBe(
      '<p><a href="/services/data-migration">data analytics</a> and ' +
        "<a href='https://www.flycatchtech.com/services/application-development-services'>apps</a></p>",
    );
  });
});
