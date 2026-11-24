#!/usr/bin/env node
/**
 * Evidence for the 斜槓青年 wild tile in the 人力市場 (#494, MK-A7/MK-A1) from a local
 * PRODUCTION build: real 2-player match via the lobby API (forcedFirstEvent =
 * ignore_first_worker_requirement), Alice is entitled and sees the wild tile.
 *
 * Prerequisite (from packages/webapp):
 *   NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3571 pnpm run build
 *   cp -R .next/static .next/standalone/packages/webapp/.next/ && cp -R public .next/standalone/packages/webapp/
 * Then:
 *   PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node docs/game-room/issue-494/capture-slash.mjs
 *
 * Starts next standalone on WEB_PORT (3570) and the game server on GAME_PORT (3571),
 * writes 1280-market-slash.png, 390-market-slash.png, 1280-slash-tile-crop.png and
 * prints the measured sub-label metrics; stops both processes.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from '@playwright/test';

const WEB_PORT = process.env.WEB_PORT ?? '3570';
const GAME_PORT = process.env.GAME_PORT ?? '3571';
const WEB = `http://localhost:${WEB_PORT}`;
const GS = `http://localhost:${GAME_PORT}`;
const GAME = 'OpenStarTerVillage';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const WEBAPP = path.resolve(OUT, '../../..');

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

const openSeat = async (browser, seat, width, height) => {
  const context = await browser.newContext({ viewport: { width, height } });
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
  await page.screenshot({ path: path.join(OUT, name) });
  console.log(`saved ${name}`);
};

const measure = (tile) => tile.evaluate((el) => {
  const sub = el.querySelector('.job-tile-sub');
  const t = el.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(sub);
  const lines = Array.from(range.getClientRects()).map((r) => ({
    left: +(r.left - t.left).toFixed(2), right: +(t.right - r.right).toFixed(2),
  }));
  return { fontSize: getComputedStyle(sub).fontSize, tileWidth: t.width, lines };
});

const main = async () => {
  startProcess('game', ['-r', './register-dist-alias.js', 'dist/src/server.js'], {
    NODE_ENV: 'production', PORT: GAME_PORT, GAME_SERVER_ORIGINS: WEB, NEXT_PUBLIC_GAME_SERVER_URL: GS,
  });
  startProcess('web', ['.next/standalone/packages/webapp/server.js'], {
    NODE_ENV: 'production', PORT: WEB_PORT, HOSTNAME: '127.0.0.1',
  });
  console.log('pids', children.map((c) => c.pid).join(' '));
  await waitFor(`${GS}/health`);
  await waitFor(WEB);
  const { seats } = await createMatch();
  const browser = await chromium.launch();
  try {
    for (const [width, height] of [[1280, 832], [390, 844]]) {
      const page = await openSeat(browser, seats['0'], width, height);
      const tile = page.locator('[data-testid^="job-card-slash-0-"]');
      await tile.waitFor();
      await tile.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      console.log(width, JSON.stringify(await measure(tile)), await page.getByTestId('job-market-count').innerText());
      await shot(page, `${width}-market-slash.png`);
      if (width === 1280) {
        const file = path.join(OUT, '1280-slash-tile-crop.png');
        await tile.screenshot({ path: file });
        console.log('saved 1280-slash-tile-crop.png');
      }
      await page.context().close();
    }
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
