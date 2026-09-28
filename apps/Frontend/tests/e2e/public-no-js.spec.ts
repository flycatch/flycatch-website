import { test, expect } from '@playwright/test';

test('home page is readable without JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('main')).toHaveAttribute('data-api-origin', /http/);
  await expect(page.locator('.summary-region').first()).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'About' })).toBeVisible();
});

test('procure-flex in-body copy is readable without JavaScript', async ({ page }) => {
  await page.goto('/solutions/procure-flex');
  await expect(page.locator('h1')).toBeVisible();
  const inBody = page.locator('.pf-why, .pf-quote, .pf-feature, [data-section-reveal]').first();
  await expect(inBody).toBeVisible();
  await expect(inBody).toHaveCSS('opacity', '1');
});
