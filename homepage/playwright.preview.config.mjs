import { defineConfig } from '@playwright/test';

if (!process.env.PREVIEW_URL) {
  throw new Error('PREVIEW_URL is required for Netlify preview smoke tests.');
}

export default defineConfig({
  testDir: './e2e',
  testMatch: 'preview.spec.mjs',
  fullyParallel: false,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.PREVIEW_URL,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
