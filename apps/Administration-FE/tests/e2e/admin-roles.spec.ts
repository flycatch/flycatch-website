import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(!adminEmail || !adminPassword, 'requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

test('settings opens roles list for an administrator', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();

  await page.getByRole('button', { name: /^settings$/i }).click();
  await expect(page).toHaveTitle(/settings/i);
  await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /add new role/i })).toBeVisible();
});
