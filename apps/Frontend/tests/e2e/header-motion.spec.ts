import { test, expect } from '@playwright/test';

test.use({
  javaScriptEnabled: true,
  viewport: { width: 1280, height: 800 },
  reducedMotion: 'no-preference',
});

const routes = ['/', '/contact-us'];

test.describe('header motion', () => {
  for (const route of routes) {
    test(`${route} hover, flyout, and pin`, async ({ page }) => {
      await page.goto(route);
      const navLabel = page.locator('.nav-link, .nav-trigger').first();
      await navLabel.hover();
      await expect(navLabel).toHaveCSS('color', 'rgb(229, 9, 20)');
      const scale = await navLabel.evaluate((el) => {
        const { transform } = getComputedStyle(el);
        const match = transform.match(/matrix\(([^)]+)\)/);
        if (!match) return 1;
        return Number(match[1].split(',')[0]);
      });
      expect(scale).toBeCloseTo(1.1, 1);

      await page.evaluate(() => window.scrollBy(0, 500));
      const header = page.locator('.site-header');
      await expect(header).toBeInViewport();
      const headerTransform = await header.evaluate((el) => getComputedStyle(el).transform);
      expect(headerTransform === 'none' || !headerTransform.includes('matrix')).toBeTruthy();
      await expect(header).not.toHaveClass(/is-hidden/);

      const servicesItem = page.locator('.nav-item.has-menu').filter({ has: page.getByRole('button', { name: 'Services' }) });
      await servicesItem.locator('.nav-trigger').hover();
      const flyout = servicesItem.locator('.flyout-panel');
      await expect(flyout).toBeVisible();
      const animationName = await flyout.evaluate((el) => getComputedStyle(el).animationName);
      expect(animationName).toMatch(/flyout-in/);
    });
  }
});
