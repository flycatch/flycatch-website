import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(!adminEmail || !adminPassword, 'requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

test('case studies, industry, case study category, and technology lists are reachable', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();

  await page.getByRole('link', { name: /^case studies$/i }).click();
  await expect(page).toHaveURL(/\/admin\/case-studies\/?$/);
  await expect(page).toHaveTitle(/case studies/i);
  await expect(page.getByRole('heading', { name: /^case studies$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /create new entry/i })).toBeVisible();

  await page.getByRole('link', { name: /^industry$/i }).click();
  await expect(page).toHaveURL(/\/admin\/industries\/?$/);
  await expect(page).toHaveTitle(/industry/i);
  await expect(page.getByRole('heading', { name: /^industry$/i })).toBeVisible();

  await page.getByRole('link', { name: /^case study category$/i }).click();
  await expect(page).toHaveURL(/\/admin\/case-study-categories\/?$/);
  await expect(page).toHaveTitle(/case study category/i);
  await expect(page.getByRole('heading', { name: /^case study category$/i })).toBeVisible();

  await page.getByRole('link', { name: /^technology$/i }).click();
  await expect(page).toHaveURL(/\/admin\/technologies\/?$/);
  await expect(page).toHaveTitle(/technology/i);
  await expect(page.getByRole('heading', { name: /^technology$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /create new entry/i })).toBeVisible();
});
