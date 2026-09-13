import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const frontendRoot = resolve(import.meta.dirname, '../..');

function source(rel: string) {
  return readFileSync(resolve(frontendRoot, rel), 'utf8');
}

function componentOrder(sourceText: string, names: string[]) {
  return names
    .map((name) => ({ name, index: sourceText.indexOf(`<${name}`) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.name);
}

describe('production page section order', () => {
  it('keeps the home page sections in production order', () => {
    const page = source('src/pages/index.astro');
    expect(
      componentOrder(page, [
        'HomeHero',
        'HomeOfferings',
        'HomeServices',
        'HomeContact',
        'HomeMinds',
        'HomeCaseStudies',
        'HomeClients',
        'HomeTestimonials',
        'HomeInsights',
        'HomeFaq',
        'HomeCta',
      ]),
    ).toEqual([
      'HomeHero',
      'HomeOfferings',
      'HomeServices',
      'HomeContact',
      'HomeMinds',
      'HomeCaseStudies',
      'HomeClients',
      'HomeTestimonials',
      'HomeInsights',
      'HomeFaq',
      'HomeCta',
    ]);
  });

  it('keeps the AI Services sections in production order', () => {
    const page = source('src/pages/services/ai-services.astro');
    expect(
      componentOrder(page, [
        'AiServicesHero',
        'AiServicesIntro',
        'AiServicesSolutions',
        'AiServicesExpertise',
        'AiServicesIndustries',
        'HomeInsights',
        'AiServicesMinds',
        'HomeCta',
      ]),
    ).toEqual([
      'AiServicesHero',
      'AiServicesIntro',
      'AiServicesSolutions',
      'AiServicesExpertise',
      'AiServicesIndustries',
      'HomeInsights',
      'AiServicesMinds',
      'HomeCta',
    ]);
  });

  it('uses production great-minds counters on AI Services', () => {
    const minds = source('src/components/AiServicesMinds.astro');
    expect(minds).toContain('home.minds_stat.years.value');
    expect(minds).toContain('home.minds_stat.projects.value');
    expect(minds).toContain('home.minds_stat.customers.value');
    expect(minds).toContain('home.minds_stat.associates.value');
    expect(minds).not.toContain('Passionate Associates');
  });
});
