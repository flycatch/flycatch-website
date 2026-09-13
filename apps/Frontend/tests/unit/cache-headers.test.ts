import { describe, expect, it } from 'vitest';

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ASSET_CACHE_CONTROL,
  FORM_CACHE_CONTROL,
  HTML_CACHE_CONTROL,
  MEDIA_CACHE_CONTROL,
  cacheControlForResponse,
} from '../../src/lib/cache-headers';

describe('cacheControlForResponse', () => {
  it('allows shared caching for HTML and does not use no-store', () => {
    const value = cacheControlForResponse('GET', '/', 'text/html; charset=utf-8');
    expect(value).toBe(HTML_CACHE_CONTROL);
    expect(value).not.toContain('no-store');
  });

  it('keeps form submissions uncacheable', () => {
    expect(cacheControlForResponse('POST', '/contact-us', 'text/html')).toBe(FORM_CACHE_CONTROL);
    expect(cacheControlForResponse('GET', '/api/forms/contact', 'application/json')).toBe(
      FORM_CACHE_CONTROL,
    );
  });

  it('does not override fingerprinted asset responses', () => {
    expect(cacheControlForResponse('GET', '/_astro/page.css', 'text/css')).toBeNull();
  });
});

describe('Caddy cache classes', () => {
  it('configures shared HTML caching and immutable asset and media caching', () => {
    const caddyfile = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../../../deployment/k8s/base/Caddyfile'),
      'utf8',
    );
    expect(caddyfile).toContain(`Cache-Control "${HTML_CACHE_CONTROL}"`);
    expect(caddyfile).toContain('handle /_astro/*');
    expect(caddyfile).toContain(`Cache-Control "${ASSET_CACHE_CONTROL}"`);
    expect(caddyfile).toContain('handle /api/v1/public/media/*');
    expect(caddyfile).toContain(`Cache-Control "${MEDIA_CACHE_CONTROL}"`);
  });
});
