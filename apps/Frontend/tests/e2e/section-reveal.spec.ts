import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: true });

test('solutions product cards zoom in once', async ({ page }) => {
  await page.goto('/solutions');
  const card = page.locator('[data-section-reveal]').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/is-visible/, { timeout: 1500 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(card).toHaveClass(/is-visible/);
});

test('procure-flex rise clusters reveal once', async ({ page }) => {
  await page.goto('/solutions/procure-flex');
  const cluster = page.locator('[data-section-reveal][data-reveal="rise"]').first();
  await cluster.scrollIntoViewIfNeeded();
  await expect(cluster).toHaveClass(/is-visible/, { timeout: 1500 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(cluster).toHaveClass(/is-visible/);
});
