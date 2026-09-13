import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetPublicApiCache } from '../../src/lib/public-api';

afterEach(() => {
  resetPublicApiCache();
  vi.unstubAllGlobals();
});

import {
  baselineSlugsUnder,
  blogStaticPaths,
  caseStudyStaticPaths,
  serviceStaticPaths,
  solutionStaticPaths,
} from '../../src/lib/static-paths';

describe('static paths', () => {
  it('emits production service slugs except the dedicated AI Services route', () => {
    expect(serviceStaticPaths().map((item) => item.params.slug)).toEqual([
      'application-development-services',
      'application-modernization',
      'mobile-application-development',
      'user-centered-design',
      'devOps-consultation',
      'infrastructure-management-and-automation',
      'cloud-migration',
      'data-migration',
      'digital-transformation',
    ]);
  });

  it('emits production solution slugs at their exact casing', () => {
    expect(solutionStaticPaths().map((item) => item.params.slug)).toContain('flyGrid-ai');
    expect(solutionStaticPaths()).toHaveLength(8);
  });

  it('sources blog paths from the public API and the production baseline', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ slug: 'how-kubernetes-help-your-growing-business' }],
        page: 1,
        per_page: 10,
        total: 1,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const paths = await blogStaticPaths();
    const slugs = paths.map((item) => item.params.slug);
    expect(slugs).toContain('how-kubernetes-help-your-growing-business');
    expect(slugs).toContain(
      'explore-practical-cloud-migration-strategies-that-enhance-scalability-security-and-performance-learn-how-to-plan-execute-and-optimize-your-move-to-the-cloud',
    );
    expect(slugs.length).toBeGreaterThanOrEqual(82);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/public/blogs');
    vi.unstubAllGlobals();
  });

  it('keeps case-study paths when the public API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const slugs = (await caseStudyStaticPaths()).map((item) => item.params.slug);
    expect(slugs).toContain('a-social-e-commerce-platform-for-medallion-retailers');
    expect(slugs).toHaveLength(20);
    vi.unstubAllGlobals();
  });

  it('extracts baseline slugs without treating the index path as a slug', () => {
    expect(baselineSlugsUnder('/company/blogs')).not.toContain('');
    expect(baselineSlugsUnder('/company/blogs')).toHaveLength(82);
  });
});
