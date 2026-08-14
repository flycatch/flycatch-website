import { test, expect } from '@playwright/test';

test('home page is readable without JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page).toHaveTitle(/Flycatch/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('.summary-region')).toBeVisible();
  await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
});
