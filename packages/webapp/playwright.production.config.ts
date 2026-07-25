import { defineConfig } from '@playwright/test';

const webPort = process.env.PLAYWRIGHT_PRODUCTION_WEB_PORT ?? '3100';
const webURL = `http://localhost:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /production-dev-route\.spec\.ts/,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: webURL,
  },
  webServer: {
    command: `pnpm exec next start --port ${webPort}`,
    url: webURL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
