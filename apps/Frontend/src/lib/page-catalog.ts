import {
  loadPublishedLanding,
  loadPublishedNamedPage,
  type PublicItemResult,
  type PublicLanding,
  type PublicNamedPage,
} from './public-api';

export const PRODUCTION_SERVICE_SLUGS = [
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
] as const;

export const PRODUCTION_SOLUTION_SLUGS = [
  'credit-life',
  'com-bus',
  'procure-flex',
  'ai-chat-support',
  'flyGrid-ai',
  'doctCare-ai',
  'talkShop-ai',
  'docSis-ai',
] as const;

export type ServiceSlug = (typeof PRODUCTION_SERVICE_SLUGS)[number];

type ServiceSource =
  | { kind: 'landing'; prefix: string; preferredSlug?: string }
  | { kind: 'named'; prefix: string; pageName: string }
  | { kind: 'dedicated' };

const SERVICE_SOURCES: Record<Exclude<ServiceSlug, 'ai-services'>, ServiceSource> = {
  'application-development-services': {
    kind: 'landing',
    prefix: '/api/v1/public/application-development',
    preferredSlug: 'application-development-services',
  },
  'application-modernization': {
    kind: 'landing',
    prefix: '/api/v1/public/application-modernization',
    preferredSlug: 'application-modernization',
  },
  'mobile-application-development': {
    kind: 'landing',
    prefix: '/api/v1/public/mobile-application-development',
    preferredSlug: 'mobile-application-development',
  },
  'user-centered-design': {
    kind: 'landing',
    prefix: '/api/v1/public/user-centered-design',
    preferredSlug: 'user-centered-design',
  },
  'devOps-consultation': {
    kind: 'landing',
    prefix: '/api/v1/public/devops-consult',
    preferredSlug: 'devOps-consultation',
  },
  'infrastructure-management-and-automation': {
    kind: 'landing',
    prefix: '/api/v1/public/infrastructure-management',
    preferredSlug: 'infrastructure-management-and-automation',
  },
  'cloud-migration': {
    kind: 'named',
    prefix: '/api/v1/public/cloud-services',
    pageName: 'cloud-migration',
  },
  'data-migration': {
    kind: 'named',
    prefix: '/api/v1/public/data-analytics',
    pageName: 'data-migration',
  },
  'digital-transformation': {
    kind: 'landing',
    prefix: '/api/v1/public/digital-transformation',
    preferredSlug: 'digital-transformation',
  },
};

export function isProductionServiceSlug(slug: string): slug is ServiceSlug {
  return (PRODUCTION_SERVICE_SLUGS as readonly string[]).includes(slug);
}

export function isProductionSolutionSlug(slug: string): boolean {
  return (PRODUCTION_SOLUTION_SLUGS as readonly string[]).includes(slug);
}

export function canonicalServiceSlug(slug: string): ServiceSlug | null {
  return PRODUCTION_SERVICE_SLUGS.find((item) => item.toLowerCase() === slug.toLowerCase()) ?? null;
}

export function canonicalSolutionSlug(slug: string): string | null {
  return PRODUCTION_SOLUTION_SLUGS.find((item) => item.toLowerCase() === slug.toLowerCase()) ?? null;
}

export function landingFromNamed(page: PublicNamedPage, slug: string): PublicLanding {
  return { ...page, slug };
}

export async function loadServiceLanding(
  slug: string,
): Promise<PublicItemResult<PublicLanding> | { item: null; error: false; origin: string; dedicated: true }> {
  if (slug === 'ai-services') {
    return { item: null, error: false, origin: '', dedicated: true };
  }
  if (!isProductionServiceSlug(slug) || slug === 'ai-services') {
    return { item: null, error: false, origin: '' };
  }
  const source = SERVICE_SOURCES[slug];
  if (source.kind === 'named') {
    const result = await loadPublishedNamedPage(source.prefix, source.pageName);
    return {
      item: result.item ? landingFromNamed(result.item, slug) : null,
      error: result.error,
      origin: result.origin,
    };
  }
  return loadPublishedLanding(source.prefix, source.preferredSlug);
}
