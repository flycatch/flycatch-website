import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('contact form is a native form with labelled fields', async ({ page }) => {
  await page.goto('/contact-us');
  const form = page.locator('form[action="/api/forms/contact"]');
  await expect(form).toHaveCount(1);
  await expect(form.locator('input[name="name"]')).toHaveAttribute('required', '');
  await expect(form.getByLabel('First name')).toBeVisible();
  await expect(form.getByLabel('Email')).toBeVisible();
  await expect(form.locator('input[name="website"]')).toHaveCount(1);
});

test('footer newsletter posts to the site form endpoint', async ({ page }) => {
  await page.goto('/');
  const form = page.locator('form[action="/api/forms/newsletter"]');
  await expect(form).toHaveCount(1);
  await expect(form.getByLabel('Email address')).toBeVisible();
});
