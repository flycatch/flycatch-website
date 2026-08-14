import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: (process.env.PUBLIC_ORIGIN || 'http://localhost:8080') + '/admin',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
