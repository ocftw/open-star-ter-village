import { defineConfig, devices } from '@playwright/test';
const webPort=process.env.PLAYWRIGHT_WEB_PORT ?? '3130';
const serverPort=process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3131';
const webURL=process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${webPort}`;
const serverURL=process.env.PLAYWRIGHT_GAME_SERVER_URL ?? `http://localhost:${serverPort}`;
export default defineConfig({
  testDir:'./e2e', testMatch:'standard.spec.ts', workers:1, retries:0,
  use:{baseURL:webURL,trace:'retain-on-failure'},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
  webServer:process.env.PLAYWRIGHT_BASE_URL ? [] : [
    ...(process.env.STANDARD_NETWORK_ONLY === '1' ? [] : [{
      command:`pnpm run start:next --port ${webPort}`,url:webURL,reuseExistingServer:true,timeout:120000,
    }]),
    {command:'pnpm run build:server && pnpm run start:server',url:`${serverURL}/health`,reuseExistingServer:true,timeout:120000,
      env:{PORT:serverPort,GAME_SERVER_ORIGINS:webURL,NEXT_PUBLIC_GAME_SERVER_URL:serverURL}},
  ],
});
