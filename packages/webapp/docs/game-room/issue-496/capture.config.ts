import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /capture\.spec\.ts/,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3532' },
});
