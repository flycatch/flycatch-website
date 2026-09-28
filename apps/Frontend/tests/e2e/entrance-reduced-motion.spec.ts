import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: true });

const routes = ['/', '/solutions'];

test.describe('reduced motion entrance', () => {
  for (const route of routes) {
    test(`${route} shows the heading immediately`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      const heading = page.locator('[data-hero-entrance]').first();
      await expect(heading).toBeVisible();
      await expect(heading).toHaveCSS('opacity', '1');
      const duration = await heading.evaluate((el) => getComputedStyle(el).transitionDuration);
      expect(duration.split(',').every((part) => part.trim() === '0s')).toBe(true);
    });
  }
});
