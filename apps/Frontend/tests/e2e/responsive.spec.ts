import { test, expect } from '@playwright/test';

const templates = ['/', '/contact-us', '/services/ai-services', '/company/about-us'];
const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'large-desktop', width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  for (const path of templates) {
    test(`${path} fits ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(path);
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth > root.clientWidth + 2;
      });
      expect(overflow, `${path} overflows at ${viewport.name}`).toBe(false);
      await expect(page.locator('main#main')).toBeVisible();
    });
  }
}
