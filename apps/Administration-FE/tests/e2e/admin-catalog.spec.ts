import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(!adminEmail || !adminPassword, 'requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

test('catalog sections are reachable from administration navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();

  await page.getByRole('link', { name: /^applications$/i }).click();
  await expect(page).toHaveURL(/\/admin\/applications\/?$/);
  await expect(page.getByRole('heading', { name: /^applications$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /create new entry/i })).toBeVisible();

  await page.getByRole('button', { name: /create new entry/i }).click();
  await expect(page.getByRole('heading', { name: /edit application|create new entry/i })).toBeVisible();
  await expect(page.getByLabel(/^name$/i)).toBeVisible();
  await expect(page.getByLabel(/^email$/i)).toBeVisible();
  await page.getByRole('button', { name: /^cancel$/i }).click();
  await expect(page).toHaveURL(/\/admin\/applications\/?$/);

  await page.getByRole('link', { name: /^news$/i }).click();
  await expect(page).toHaveURL(/\/admin\/news\/?$/);
  await expect(page.getByRole('heading', { name: /^news$/i })).toBeVisible();

  await page.getByRole('link', { name: /^memberships$/i }).click();
  await expect(page).toHaveURL(/\/admin\/memberships\/?$/);
  await expect(page.getByRole('heading', { name: /^memberships$/i })).toBeVisible();
});
