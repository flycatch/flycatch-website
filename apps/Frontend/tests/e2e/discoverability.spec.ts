import { test, expect } from '@playwright/test';

test('sitemap excludes admin URLs', async ({ request, baseURL }) => {
  const response = await request.get(`${baseURL?.replace(/\/$/, '')}/sitemap-0.xml`);
  expect(response.ok()).toBeTruthy();
  const body = await response.text();
  expect(body).not.toContain('/admin');
  expect(body).not.toContain('/api');
});
