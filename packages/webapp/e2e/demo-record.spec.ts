// Demo recording: Home -> Lobby -> Create 3-player room -> Wait for players -> Start -> Game view
// Run: PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers yarn playwright test e2e/demo-record.spec.ts
// Video saved to: packages/webapp/demo-videos/
import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test('demo: full multiplayer flow', async ({}, testInfo) => {
  const videoDir = path.join(testInfo.outputDir, 'videos');
  fs.mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({ slowMo: 600 });

  // Alice — main recorded perspective
  const aliceCtx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } },
  });
  const alice = await aliceCtx.newPage();

  // Bob and Charlie — silent background joiners
  const bobCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const charlieCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const bob = await bobCtx.newPage();
  const charlie = await charlieCtx.newPage();

  // Step 1: Home page
  await alice.goto('http://localhost:3000');
  await alice.waitForLoadState('networkidle');
  await alice.waitForTimeout(1500);

  // Step 2: Navigate to Lobby
  await alice.getByRole('link', { name: /play online/i }).click();
  await alice.waitForURL(/\/lobby/);
  await alice.waitForLoadState('networkidle');
  await alice.waitForTimeout(1200);

  // Step 3: Fill player name and create 3-player match
  await alice.getByLabel(/player name/i).fill('Alice');
  await alice.waitForTimeout(800);
  await alice.getByLabel(/players/i).click();
  await alice.waitForTimeout(500);
  await alice.getByRole('option', { name: /3 players/i }).click();
  await alice.waitForTimeout(800);
  await alice.getByRole('button', { name: /create game/i }).click();
  await alice.waitForURL(/\/game\//, { timeout: 15_000 });
  await alice.waitForTimeout(1500);

  // Step 4: Waiting room — 1/3 seats filled
  await expect(alice.getByRole('heading', { name: /waiting room/i })).toBeVisible();
  await alice.waitForTimeout(2000);

  // Step 5: Bob joins
  await bob.goto('http://localhost:3000/lobby');
  await bob.getByLabel(/player name/i).fill('Bob');
  await bob.waitForTimeout(500);
  await expect(bob.getByRole('button', { name: /join/i }).first()).toBeVisible({ timeout: 10_000 });
  await bob.getByRole('button', { name: /join/i }).first().click();
  await bob.waitForURL(/\/game\//, { timeout: 15_000 });
  await alice.waitForTimeout(4000); // wait for Alice's 3s poll to update

  // Step 6: Charlie joins
  await charlie.goto('http://localhost:3000/lobby');
  await charlie.getByLabel(/player name/i).fill('Charlie');
  await charlie.waitForTimeout(500);
  await expect(charlie.getByRole('button', { name: /join/i }).first()).toBeVisible({ timeout: 10_000 });
  await charlie.getByRole('button', { name: /join/i }).first().click();
  await charlie.waitForURL(/\/game\//, { timeout: 15_000 });

  // Step 7: All seats filled — Alice sees Start Game
  await expect(alice.getByRole('button', { name: /start game/i })).toBeVisible({ timeout: 15_000 });
  await alice.waitForTimeout(2000);

  // Step 8: Alice starts the game
  await alice.getByRole('button', { name: /start game/i }).click();

  // Step 9: Game board appears
  await expect(alice.getByRole('heading', { name: /waiting room/i })).not.toBeVisible({ timeout: 20_000 });
  await alice.waitForTimeout(4000);

  // Save video
  const videoPath = await aliceCtx.pages()[0].video()?.path();
  await aliceCtx.close();
  await bobCtx.close();
  await charlieCtx.close();
  await browser.close();

  if (videoPath) {
    const dest = path.join('demo-videos', `multiplayer-demo-${Date.now()}.webm`);
    fs.mkdirSync('demo-videos', { recursive: true });
    fs.copyFileSync(videoPath, dest);
    console.log(`\nDemo video saved: ${dest}`);
    testInfo.attach('demo-video', { path: dest, contentType: 'video/webm' });
  }
});
