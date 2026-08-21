import { test, expect } from '@playwright/test';

const editorEmail = process.env.E2E_EDITOR_EMAIL;
const editorPassword = process.env.E2E_EDITOR_PASSWORD;

test.skip(!editorEmail || !editorPassword, 'requires E2E_EDITOR_EMAIL and E2E_EDITOR_PASSWORD');

test('editor can draft but cannot publish', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/email/i).fill(editorEmail);
  await page.getByLabel(/password/i).fill(editorPassword);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();
  await page.getByRole('link', { name: /^home$/i }).click();
  await page.getByRole('button', { name: /create new entry/i }).click();
  await page.getByLabel(/^title$/i).first().fill(`Editor home ${Date.now()}`);
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.getByRole('button', { name: /^edit$/i }).first().click();
  const publish = page.getByRole('button', { name: /^publish$/i });
  await expect(publish).toBeDisabled();
  await expect(publish).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText(/you do not have permission/i)).toBeVisible();
});
