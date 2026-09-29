import { test, expect } from '@playwright/test';

test('sitemap excludes admin URLs and redirect duplicates', async ({ request, baseURL }) => {
  const origin = baseURL?.replace(/\/$/, '') || '';
  const response = await request.get(`${origin}/sitemap.xml`);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type'] || '').toMatch(/xml/);
  const body = await response.text();
  expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  expect(body).toContain('<lastmod>');
  expect(body).toContain('<changefreq>');
  expect(body).toContain('<priority>');
  expect(body).not.toContain('/admin');
  expect(body).not.toContain('/api/');
  expect(body).not.toContain(`${origin}/about<`);
  expect(body).not.toContain('/solutions/combus');
  expect(body).toContain('/privacy-policy');
  expect(body).toContain('/terms-and-conditions');
  expect(body).toContain('/company/blogs');
  expect(body).toContain('/case-studies');

  // Production home loc has no trailing slash
  expect(body).toContain(`<loc>${origin}</loc>`);
  expect(body).not.toContain(`<loc>${origin}/</loc>`);

  const locs = [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) => m[1].trim());
  const paths = locs.map((loc) => {
    const pathname = new URL(loc).pathname;
    return pathname === '/' || pathname === '' ? '/' : pathname.replace(/\/$/, '') || '/';
  });
  expect(new Set(paths).size).toBe(paths.length);
});

test('legacy SEO redirects preserve production URLs', async ({ request, baseURL }) => {
  const origin = baseURL?.replace(/\/$/, '') || '';

  const en = await request.get(`${origin}/en/services`, { maxRedirects: 0 });
  expect(en.status()).toBe(301);
  expect(en.headers().location).toMatch(/\/services$/);

  const about = await request.get(`${origin}/about`, { maxRedirects: 0 });
  expect(about.status()).toBe(301);
  expect(about.headers().location).toMatch(/\/company\/about-us$/);

  const slash = await request.get(`${origin}/services/`, { maxRedirects: 0 });
  expect(slash.status()).toBe(301);
  expect(slash.headers().location).toMatch(/\/services$/);

  const membership = await request.get(`${origin}/company/membership`, { maxRedirects: 0 });
  expect(membership.status()).toBe(301);
  expect(membership.headers().location).toMatch(/\/company\/memberships$/);
});
