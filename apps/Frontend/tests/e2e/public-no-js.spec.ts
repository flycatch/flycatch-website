import { test, expect } from '@playwright/test';

test('home page is readable without JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('main')).toHaveAttribute('data-api-origin', /http/);
  await expect(page.locator('.summary-region').first()).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'About' })).toBeVisible();
});
