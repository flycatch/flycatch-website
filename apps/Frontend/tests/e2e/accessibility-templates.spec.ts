import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const templates = [
  '/',
  '/contact-us',
  '/company/about-us',
  '/services/ai-services',
  '/case-studies',
  '/company/blogs',
];

test.use({ javaScriptEnabled: true });

for (const path of templates) {
  test(`${path} has landmarks, one h1, and no critical a11y violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main');
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((item) => item.impact === 'critical');
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
}
