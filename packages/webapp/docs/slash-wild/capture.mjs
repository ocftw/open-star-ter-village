#!/usr/bin/env node
/**
 * Evidence screenshots for the 斜槓青年 per-turn wild job card, from a local
 * PRODUCTION build (the /dev route is 404 in production, so this drives a real
 * match through the game server's lobby API).
 *
 * Prerequisite (from packages/webapp):
 *   NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3561 pnpm run build
 *   cp -R .next/static .next/standalone/packages/webapp/.next/ && cp -R public .next/standalone/packages/webapp/
 * Then:
 *   PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node docs/slash-wild/capture.mjs
 *
 * Starts `next` standalone on WEB_PORT (3560) and the game server on
 * GAME_PORT (3561), captures at 1280 wide into docs/slash-wild/, stops both.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from '@playwright/test';

const WEB_PORT = process.env.WEB_PORT ?? '3560';
const GAME_PORT = process.env.GAME_PORT ?? '3561';
const WEB = `http://localhost:${WEB_PORT}`;
const GS = `http://localhost:${GAME_PORT}`;
const GAME = 'OpenStarTerVillage';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const WEBAPP = path.resolve(OUT, '../..');

const children = [];
const startProcess = (name, args, env) => {
  const child = spawn('node', args, { cwd: WEBAPP, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (d) => process.env.VERBOSE && process.stdout.write(`[${name}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`));
  children.push(child);
};
const stopAll = () => children.forEach((child) => child.kill('SIGTERM'));

const waitFor = async (url) => {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`timed out waiting for ${url}`);
};

const api = async (method, route, body) => {
  const res = await fetch(`${GS}/games/${GAME}${route}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${route}: ${res.status} ${await res.text()}`);
  return res.json();
};

/** 2-player match whose first round event is 斜槓青年, both seats joined and started. */
const createMatch = async () => {
  const { matchID } = await api('POST', '/create', {
    numPlayers: 2,
    setupData: { forcedFirstEvent: 'ignore_first_worker_requirement' },
  });
  const seats = {};
  for (const [playerID, name] of [['0', 'Alice'], ['1', 'Bob']]) {
    const joined = await api('POST', `/${matchID}/join`, { playerID, playerName: name, data: { displayName: name } });
    seats[playerID] = { matchID, playerID, credential: joined.playerCredentials, playerName: name };
  }
  await api('POST', `/${matchID}/update`, {
    playerID: '0', credentials: seats['0'].credential, data: { started: true, displayName: 'Alice' },
  });
  return { matchID, seats };
};

const openSeat = async (browser, seat) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await context.addInitScript((s) => {
    localStorage.setItem(`open-star-ter-village.match-credentials.${s.matchID}`, JSON.stringify(s));
    localStorage.setItem('open-star-ter-village.player-name', s.playerName);
  }, seat);
  const page = await context.newPage();
  await page.goto(`${WEB}/game/${seat.matchID}`);
  const board = page.locator('[data-game-board]');
  await board.waitFor({ timeout: 30_000 });
  await page.waitForFunction(
    () => document.querySelector('[data-game-board]')?.getAttribute('data-round-start-ready') === 'true',
    null, { timeout: 30_000 },
  );
  const overlay = page.getByTestId('round-start-overlay');
  if (await overlay.isVisible()) {
    await overlay.getByRole('button', { name: '知道了', exact: true }).click();
    await overlay.waitFor({ state: 'detached' });
  }
  return page;
};

const shot = async (page, name) => {
  const file = path.join(OUT, name);
  // Viewport-only: a fullPage capture resizes the viewport, which remounts the
  // board layout and drops a half-built action.
  await page.screenshot({ path: file });
  console.log(`saved docs/slash-wild/${name}`);
};

const main = async () => {
  startProcess('game', ['-r', './register-dist-alias.js', 'dist/src/server.js'], {
    NODE_ENV: 'production',
    PORT: GAME_PORT,
    GAME_SERVER_ORIGINS: WEB,
    NEXT_PUBLIC_GAME_SERVER_URL: GS,
  });
  startProcess('web', ['.next/standalone/packages/webapp/server.js'], {
    NODE_ENV: 'production',
    PORT: WEB_PORT,
    HOSTNAME: '127.0.0.1',
  });
  await waitFor(`${GS}/health`);
  await waitFor(WEB);

  const { seats } = await createMatch();
  const browser = await chromium.launch();
  try {
    // (a) Alice (entitled current player): the 斜槓青年 tile is first in the market.
    const alice = await openSeat(browser, seats['0']);
    const wild = alice.locator('[data-testid^="job-card-slash-0-"]');
    await wild.waitFor();
    await shot(alice, '01-entitled-market-wild-tile.png');

    // (c) Bob during Alice's turn: his market has no wild tile.
    const bob = await openSeat(browser, seats['1']);
    if (await bob.locator('[data-testid^="job-card-slash-"]').count()) {
      throw new Error("Bob can see Alice's wild card");
    }
    await shot(bob, '03-other-player-market-no-wild-tile.png');

    // (b) Alice: 發起專案 → hand card → wild tile → profession picker.
    await alice.getByTestId('action-createProject').click();
    await alice.locator('[data-testid^="hand-card-"]').first().click();
    await wild.click();
    const targets = alice.locator('[data-testid^="profession-target-"]');
    await targets.first().waitFor();
    const target = targets.last();
    await target.click();
    await shot(alice, '02-profession-picker-for-wild-tile.png');

    await alice.getByTestId('ca-confirm').click();
    await wild.waitFor({ state: 'detached' });
    await alice.waitForTimeout(800);
    await shot(alice, '04-project-created-with-wild-card.png');
  } finally {
    await browser.close();
    stopAll();
  }
};

main().catch((error) => {
  console.error(error);
  stopAll();
  process.exit(1);
});
