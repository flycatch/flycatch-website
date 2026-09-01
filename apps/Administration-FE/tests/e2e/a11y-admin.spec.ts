import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const stackReady = Boolean(process.env.E2E_A11Y || process.env.E2E_ADMIN_EMAIL);

test.skip(!stackReady, 'requires a running Administration FE (set E2E_A11Y or E2E_ADMIN_EMAIL)');

test('sign-in state has no critical WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical');
  expect(critical).toEqual([]);
});

const editorEmail = process.env.E2E_EDITOR_EMAIL;
const editorPassword = process.env.E2E_EDITOR_PASSWORD;

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test('applications list and form have no critical WCAG 2.2 AA violations', async ({ page }) => {
  test.skip(!adminEmail || !adminPassword, 'requires admin credentials');
  await page.goto('/');
  await page.getByLabel(/email/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();
  await page.getByRole('link', { name: /^applications$/i }).click();
  await expect(page.getByRole('heading', { name: /^applications$/i })).toBeVisible();
  const listResults = await new AxeBuilder({ page }).analyze();
  expect(listResults.violations.filter((v) => v.impact === 'critical')).toEqual([]);
  await page.getByRole('button', { name: /create new entry/i }).click();
  await expect(page.getByLabel(/^name$/i)).toBeVisible();
  const formResults = await new AxeBuilder({ page }).analyze();
  expect(formResults.violations.filter((v) => v.impact === 'critical')).toEqual([]);
});

test('permission-denied state has no critical WCAG 2.2 AA violations', async ({ page }) => {
  test.skip(!editorEmail || !editorPassword, 'requires editor credentials');
  await page.goto('/');
  await page.getByLabel(/email/i).fill(editorEmail);
  await page.getByLabel(/password/i).fill(editorPassword);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible();
  await page.getByRole('link', { name: /^home$/i }).click();
  await page.getByRole('button', { name: /create new entry/i }).click();
  await expect(page.getByText(/you do not have permission/i)).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical');
  expect(critical).toEqual([]);
});
