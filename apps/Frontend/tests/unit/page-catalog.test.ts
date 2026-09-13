import { describe, expect, it } from 'vitest';
import {
  PRODUCTION_SERVICE_SLUGS,
  PRODUCTION_SOLUTION_SLUGS,
  canonicalServiceSlug,
  canonicalSolutionSlug,
  isProductionServiceSlug,
  isProductionSolutionSlug,
} from '../../src/lib/page-catalog';
import { implementedPublicPaths, isImplementedPublicHref } from '../../src/lib/nav';

describe('production page catalog', () => {
  it('covers the ten production service slugs at their exact casing', () => {
    expect([...PRODUCTION_SERVICE_SLUGS]).toEqual([
      'application-development-services',
      'application-modernization',
      'mobile-application-development',
      'user-centered-design',
      'devOps-consultation',
      'infrastructure-management-and-automation',
      'cloud-migration',
      'data-migration',
      'digital-transformation',
      'ai-services',
    ]);
    expect(isProductionServiceSlug('devOps-consultation')).toBe(true);
    expect(isProductionServiceSlug('devops-consultation')).toBe(false);
  });

  it('covers the eight production solution slugs at their exact casing', () => {
    expect([...PRODUCTION_SOLUTION_SLUGS]).toEqual([
      'credit-life',
      'com-bus',
      'procure-flex',
      'ai-chat-support',
      'flyGrid-ai',
      'doctCare-ai',
      'talkShop-ai',
      'docSis-ai',
    ]);
    expect(isProductionSolutionSlug('flyGrid-ai')).toBe(true);
    expect(isProductionSolutionSlug('flygrid-ai')).toBe(false);
    expect(canonicalSolutionSlug('flygrid-ai')).toBe('flyGrid-ai');
    expect(canonicalServiceSlug('devops-consultation')).toBe('devOps-consultation');
  });

  it('registers those routes as implemented navigation targets', () => {
    for (const slug of PRODUCTION_SERVICE_SLUGS) {
      expect(implementedPublicPaths.has(`/services/${slug}`)).toBe(true);
    }
    expect(isImplementedPublicHref('/solutions/flyGrid-ai')).toBe(true);
    expect(isImplementedPublicHref('/contact-us')).toBe(true);
    expect(isImplementedPublicHref('/privacy-policy')).toBe(true);
    expect(isImplementedPublicHref('/terms-and-conditions')).toBe(true);
    expect(isImplementedPublicHref('/software-development-services-in-saudi-arabia')).toBe(true);
  });
});
