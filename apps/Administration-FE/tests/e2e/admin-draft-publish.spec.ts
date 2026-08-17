import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(!adminEmail || !adminPassword, 'requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

test('administrator can save a draft and publish with Bearer session', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();
  await page.getByRole('button', { name: /home page/i }).click();
  await page.getByRole('button', { name: /save draft/i }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.getByRole('button', { name: /^publish$/i }).click();
  await expect(page.getByText(/rebuild the public site/i)).toBeVisible();
});
