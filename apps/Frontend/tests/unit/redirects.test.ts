import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  applicationRedirectRules,
  hostSchemeRedirect,
  redirectForPath,
  redirectHops,
} from '../../src/lib/redirects';
import { resolveRoute } from '../../src/lib/route-registry';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const mapping = JSON.parse(
  readFileSync(
    join(repoRoot, 'openspec/changes/migrate-flycatch-website/baseline/url-mapping.json'),
    'utf8',
  ),
);
const baseline = JSON.parse(
  readFileSync(
    join(repoRoot, 'openspec/changes/migrate-flycatch-website/baseline/production-urls.json'),
    'utf8',
  ),
) as { urls: { path: string }[] };

describe('redirect map', () => {
  it('is generated from the checked-in mapping file', () => {
    const deployed = applicationRedirectRules().map((rule) => `${rule.from}->${rule.to}`).sort();
    const expected = [...mapping.case_variants, ...mapping.inherited_redirects, ...mapping.non_sitemap_200]
      .filter((rule: { status: number; from: string }) => rule.status === 301 && !rule.from.includes(':'))
      .map((rule: { from: string; to: string }) => `${rule.from}->${rule.to}`)
      .sort();
    expect(deployed).toEqual(expected);
  });

  it('sends lowercase camelCase variants and inherited aliases in one hop', () => {
    expect(redirectForPath('/services/devops-consultation')).toBe('/services/devOps-consultation');
    expect(redirectForPath('/solutions/flygrid-ai')).toBe('/solutions/flyGrid-ai');
    expect(redirectForPath('/services/hybrid-cloud')).toBe('/services/cloud-migration');
    expect(redirectForPath('/en')).toBe('/');
    expect(redirectForPath('/en/contact-us')).toBe('/contact-us');
    expect(redirectForPath('/contact-us/')).toBe('/contact-us');
    expect(redirectForPath('/company')).toBe('/');
    expect(redirectHops('/services/devops-consultation')).toEqual(['/services/devOps-consultation']);
  });

  it('canonicalizes host and scheme in a single hop', () => {
    expect(
      hostSchemeRedirect('http:', 'flycatchtech.com', 'http://flycatchtech.com/contact-us'),
    ).toBe('https://www.flycatchtech.com/contact-us');
    expect(
      hostSchemeRedirect('https:', 'www.flycatchtech.com', 'https://www.flycatchtech.com/contact-us'),
    ).toBeNull();
  });

  it('fails when a mapped redirect would chain', () => {
    expect(() => redirectHops('/loop-start')).not.toThrow();
    const hops = applicationRedirectRules().map((rule) => redirectHops(rule.from));
    for (const chain of hops) {
      expect(chain.length).toBe(1);
    }
  });
});

describe('artifact blog slugs', () => {
  it('resolves word-splitting, possessive, duplicate, and long production slugs unchanged', () => {
    const blogs = baseline.urls
      .map((entry) => entry.path)
      .filter((path) => path.startsWith('/company/blogs/'));
    const samples = blogs.filter(
      (path) =>
        path.includes('dev-sec-ops') ||
        path.includes('saa-s') ||
        path.includes('soft-pos') ||
        path.includes('i-o') ||
        path.includes('-s-') ||
        /-\d$/.test(path) ||
        path.length > 160,
    );
    expect(samples.length).toBeGreaterThan(4);
    for (const path of samples) {
      expect(resolveRoute(path)?.path).toBe(path);
      expect(redirectForPath(path)).toBeNull();
    }
  });
});
