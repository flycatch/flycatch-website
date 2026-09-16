import { describe, expect, it } from 'vitest';
import {
  resolveSolutionDetailRoute,
  solutionDetailByPathSlug,
  solutionDetailPath,
  SOLUTION_DETAIL_PRODUCTS,
} from '../../src/lib/solution-detail';

describe('solution detail routes', () => {
  it('maps mixed-case and lowercase URL slugs to the CMS api slug', () => {
    expect(resolveSolutionDetailRoute('doctCare-ai')?.apiSlug).toBe('doctcare-ai');
    expect(resolveSolutionDetailRoute('doctcare-ai')?.pathSlug).toBe('doctCare-ai');
    expect(resolveSolutionDetailRoute('docSis-ai')?.apiSlug).toBe('docsis-ai');
    expect(resolveSolutionDetailRoute('talkShop-ai')?.pathSlug).toBe('talkShop-ai');
    expect(resolveSolutionDetailRoute('flyGrid-ai')?.pathSlug).toBe('flyGrid-ai');
  });

  it('ignores unpublished solution stubs', () => {
    expect(resolveSolutionDetailRoute('credit-life')).toBeNull();
    expect(resolveSolutionDetailRoute('docsist-ai')).toBeNull();
    expect(resolveSolutionDetailRoute(undefined)).toBeNull();
  });

  it('builds canonical mixed-case paths', () => {
    expect(SOLUTION_DETAIL_PRODUCTS.map(solutionDetailPath)).toEqual([
      '/solutions/doctCare-ai',
      '/solutions/docSis-ai',
      '/solutions/talkShop-ai',
      '/solutions/flyGrid-ai',
    ]);
    expect(solutionDetailByPathSlug('docSis-ai').apiSlug).toBe('docsis-ai');
  });
});
