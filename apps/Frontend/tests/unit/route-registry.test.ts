import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { implementedPublicPaths } from '../../src/lib/nav';
import {
  resolveRoute,
  registeredExactPaths,
  sitemapEligible,
} from '../../src/lib/route-registry';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const baseline = JSON.parse(
  readFileSync(
    join(repoRoot, 'openspec/changes/migrate-flycatch-website/baseline/production-urls.json'),
    'utf8',
  ),
) as { urls: { path: string }[] };

describe('route registry', () => {
  it('resolves every baseline production URL', () => {
    expect(baseline.urls).toHaveLength(139);
    for (const entry of baseline.urls) {
      const resolved = resolveRoute(entry.path);
      expect(resolved, entry.path).not.toBeNull();
      expect(resolved?.path).toBe(entry.path === '' ? '/' : entry.path);
      expect(resolved?.inSitemap).toBe(true);
    }
  });

  it('resolves every statically implemented public path', () => {
    for (const path of implementedPublicPaths) {
      expect(resolveRoute(path), path).not.toBeNull();
    }
  });

  it('maps page types and structured data for key templates', () => {
    expect(resolveRoute('/')?.pageKind).toBe('home');
    expect(resolveRoute('/services/ai-services')?.structuredDataType).toBe('Service');
    expect(resolveRoute('/solutions/flyGrid-ai')?.params).toEqual({});
    expect(resolveRoute('/company/blogs/how-kubernetes-help-your-growing-business')?.structuredDataType).toBe(
      'BlogPosting',
    );
    expect(resolveRoute('/case-studies/a-novel-solution-for-credit-building')?.structuredDataType).toBe(
      'Article',
    );
    expect(resolveRoute('/company/blogs/how-kubernetes-help-your-growing-business')?.ancestors.map((item) => item.path)).toEqual(
      ['/', '/company/blogs'],
    );
  });

  it('does not resolve unknown or extra-nested paths', () => {
    expect(resolveRoute('/not-a-real-page')).toBeNull();
    expect(resolveRoute('/company/blogs/foo/bar')).toBeNull();
    expect(sitemapEligible('/not-a-real-page')).toBe(false);
  });

  it('registers the static marketing routes used by the sitemap', () => {
    expect(registeredExactPaths()).toEqual(expect.arrayContaining(['/', '/contact-us', '/privacy-policy']));
  });
});
