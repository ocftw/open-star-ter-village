import { defineConfig, devices } from '@playwright/test';

// The wrapper serves the candidate's production build before running this config.
export default defineConfig({
  testDir: '../../../e2e',
  testMatch: 'contribute-flow.spec.ts',
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${process.env.PLAYWRIGHT_WEB_PORT ?? '3550'}`,
  },
});
