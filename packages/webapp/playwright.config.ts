import { defineConfig, devices } from '@playwright/test';

const webPort = process.env.PLAYWRIGHT_WEB_PORT ?? '3000';
const gameServerPort = process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001';
const webURL = `http://localhost:${webPort}`;
const gameServerURL = `http://localhost:${gameServerPort}`;

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const databaseEnv: Record<string, string> = databaseUrl ? { DATABASE_URL: databaseUrl } : {};
const hostSecretEnv: Record<string, string> = process.env.GAME_SERVER_AUTH_SECRET
  ? { GAME_SERVER_AUTH_SECRET: process.env.GAME_SERVER_AUTH_SECRET }
  : {};

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
        ...databaseEnv,
        ...hostSecretEnv,
        ...(process.env.AUTH_SECRET ? { AUTH_SECRET: process.env.AUTH_SECRET } : {}),
        ...(process.env.AUTH_TEST_LOGIN ? { AUTH_TEST_LOGIN: process.env.AUTH_TEST_LOGIN } : {}),
        NEXT_PUBLIC_GAME_SERVER_URL: gameServerURL,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'pnpm run dev:server',
      url: `${gameServerURL}/health`,
      env: {
        ...databaseEnv,
        ...hostSecretEnv,
        GAME_SERVER_ORIGINS: webURL,
        NEXT_PUBLIC_GAME_SERVER_URL: gameServerURL,
        PORT: gameServerPort,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
