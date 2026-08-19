import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(!adminEmail || !adminPassword, 'requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

test('blogs list is reachable from administration navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();

  await page.getByRole('button', { name: /^blogs$/i }).click();
  await expect(page).toHaveTitle(/blogs/i);
  await expect(page.getByRole('heading', { name: /^blogs$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /create new entry/i })).toBeVisible();
});
