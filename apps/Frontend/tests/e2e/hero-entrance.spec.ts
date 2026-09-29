import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: true });

const routes = [
  '/',
  '/solutions',
  '/services/application-development-services',
  '/company/careers',
  '/contact-us',
];

test.describe('primary heading entrance', () => {
  for (const route of routes) {
    test(`${route} reveals the primary heading once`, async ({ page }) => {
      await page.goto(route);
      const heading = page.locator('[data-hero-entrance]').first();
      await expect(heading).toBeVisible();
      // CSS keyframes entrance — wait for animation to finish (0.6s + buffer).
      await expect(heading).toHaveCSS('opacity', '1', { timeout: 1500 });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(heading).toHaveCSS('opacity', '1');
    });
  }
});
