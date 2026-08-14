import { test, expect } from '@playwright/test';

test.skip('admin draft publish journey requires running stack', async ({ page }) => {
  await page.goto('/admin/sign-in');
  await page.getByLabel(/email/i).fill('admin@example.com');
  await page.getByLabel(/password/i).fill('password123456');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();
});
