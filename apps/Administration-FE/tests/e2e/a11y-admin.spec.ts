import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.skip('admin a11y requires running stack', async ({ page }) => {
  await page.goto('/admin/sign-in');
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical');
  expect(critical).toEqual([]);
});
