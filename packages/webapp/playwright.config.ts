import { defineConfig, devices } from '@playwright/test';

const webPort = process.env.PLAYWRIGHT_WEB_PORT ?? '3000';
const gameServerPort = process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001';
const webURL = `http://localhost:${webPort}`;
const gameServerURL = `http://localhost:${gameServerPort}`;

export default defineConfig({
  testDir: './e2e',
  testIgnore: /production-dev-route\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: webURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: `pnpm run dev:next --port ${webPort}`,
      url: webURL,
      env: {
        NEXT_PUBLIC_GAME_SERVER_URL: gameServerURL,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm run dev:server',
      url: `${gameServerURL}/health`,
      env: {
        GAME_SERVER_ORIGINS: webURL,
        NEXT_PUBLIC_GAME_SERVER_URL: gameServerURL,
        PORT: gameServerPort,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
