import { test, expect } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(!adminEmail || !adminPassword, 'requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

test('sign-in success, generic failure, no sign-up, and sign-out', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign up|register|create account/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /sign up|register|create account/i })).toHaveCount(0);

  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill('wrong-password-value');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  const failureText = await page.getByRole('alert').innerText();

  await page.getByLabel(/email/i).fill('unknown@example.com');
  await page.getByLabel(/password/i).fill('wrong-password-value');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('alert')).toHaveText(failureText);

  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();

  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
});
