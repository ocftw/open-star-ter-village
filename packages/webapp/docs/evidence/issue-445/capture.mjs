#!/usr/bin/env node
/**
 * #445 evidence capture: the end-game persist warning on a local PRODUCTION
 * build with real PostgreSQL. Re-runnable; nothing secret is written to disk.
 *
 * Prerequisites (from packages/webapp):
 *   source /path/to/pg-up.sh            # exports TEST_DATABASE_URL (superuser on a throwaway cluster)
 *   NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3571 pnpm run build
 *   node docs/evidence/issue-445/capture.mjs
 *
 * What it does:
 *   1. creates a scratch database and a login role (random password) on the
 *      TEST_DATABASE_URL cluster, and a throwaway GAME_SERVER_AUTH_SECRET;
 *   2. starts the compiled game server (dist, MATCH_PERSISTENCE=member) on
 *      3571 and the Next.js standalone server on 3570;
 *   3. creates a member-hosted match with a test-minted host token, seats
 *      Alice and Bob, revokes UPDATE on `matches` from the server's role so
 *      the end-game write and its retry fail, and ends the game with
 *      boardgame.io clients;
 *   4. screenshots the 遊戲結束 dialog (1280 seat, 390 seat, 1280 observer),
 *      restores UPDATE, waits for the background retry to persist the
 *      result, and screenshots the cleared dialog;
 *   5. stops everything and drops the scratch database and role.
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const webapp = path.resolve(here, '../../..');
const require = createRequire(path.join(webapp, 'package.json'));
const { SignJWT } = await import(require.resolve('jose'));
const { Client: PgClient } = require('pg');
const { Client, LobbyClient } = require('boardgame.io/client');
const { SocketIO } = require('boardgame.io/multiplayer');
const { chromium } = require('@playwright/test');
require(path.join(webapp, 'register-dist-alias.js'));
const { default: game } = require(path.join(webapp, 'dist/src/game/index.js'));

const WEB_PORT = 3570;
const GAME_PORT = 3571;
const WEB = `http://localhost:${WEB_PORT}`;
const GAME = `http://localhost:${GAME_PORT}`;
const OUT = here;
const AUDIENCE = 'open-star-ter-village:game-server';
const gameName = game.name;

const baseUrl = process.env.TEST_DATABASE_URL;
if (!baseUrl) throw new Error('Set TEST_DATABASE_URL (source pg-up.sh) first');
if (!existsSync(path.join(webapp, '.next/standalone/packages/webapp/server.js'))) {
  throw new Error('Run `NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3571 pnpm run build` first');
}

const suffix = randomBytes(4).toString('hex');
const dbName = `osv_capture_${suffix}`;
const role = `osv_capture_${suffix}`;
const rolePassword = randomBytes(18).toString('base64url');
const secret = randomBytes(32).toString('base64url');
const withDb = (url, db, user) => {
  const parsed = new URL(url);
  parsed.pathname = `/${db}`;
  if (user) { parsed.username = user; parsed.password = rolePassword; }
  return parsed.toString();
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, timeoutMs = 30_000, label = 'condition') {
  const end = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > end) throw new Error(`timeout waiting for ${label}`);
    await sleep(100);
  }
}

const children = [];
function run(name, args, env) {
  const child = spawn(process.execPath, args, { cwd: webapp, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  // Server logs carry fixed messages only; echo them with CAPTURE_VERBOSE=1.
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => { if (process.env.CAPTURE_VERBOSE) process.stdout.write(`[${name}] ${chunk}`); });
  }
  children.push(child);
  return child;
}

const root = new PgClient({ connectionString: baseUrl });
await root.connect();
await root.query(`create database ${dbName}`);
await root.query(`create role ${role} login password '${rolePassword}'`);
await root.end();
const admin = new PgClient({ connectionString: withDb(baseUrl, dbName) });
await admin.connect();
await admin.query(`grant all on schema public to ${role}`);

let browser;
try {
  // Standalone Next needs its static assets next to server.js (as in e2e:production).
  const standalone = path.join(webapp, '.next/standalone/packages/webapp');
  mkdirSync(path.join(standalone, '.next'), { recursive: true });
  cpSync(path.join(webapp, '.next/static'), path.join(standalone, '.next/static'), { recursive: true });
  cpSync(path.join(webapp, 'public'), path.join(standalone, 'public'), { recursive: true });

  run('game', ['-r', './register-dist-alias.js', 'dist/src/server.js'], {
    NODE_ENV: 'production',
    PORT: String(GAME_PORT),
    GAME_SERVER_ORIGINS: WEB,
    NEXT_PUBLIC_GAME_SERVER_URL: GAME,
    MATCH_PERSISTENCE: 'member',
    DATABASE_URL: withDb(baseUrl, dbName, role),
    GAME_SERVER_AUTH_SECRET: secret,
    SENTRY_DSN: '',
  });
  run('next', [path.join(standalone, 'server.js')], { NODE_ENV: 'production', PORT: String(WEB_PORT), HOSTNAME: '127.0.0.1' });

  await until(async () => (await fetch(`${GAME}/health`).then((r) => r.json()).catch(() => null))?.persistence === 'on', 30_000, 'game server');
  await until(async () => (await fetch(WEB).catch(() => null))?.ok, 60_000, 'next server');

  const lobby = new LobbyClient({ server: GAME });
  const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject('capture-member')
    .setAudience(AUDIENCE).setIssuedAt().setExpirationTime('2m').sign(new TextEncoder().encode(secret));
  const { matchID } = await lobby.createMatch(gameName, { numPlayers: 2 }, { headers: { Authorization: `Bearer ${token}` } });
  const seats = [];
  for (const [index, playerName] of ['Alice', 'Bob'].entries()) {
    const playerID = String(index);
    const joined = await lobby.joinMatch(gameName, matchID, { playerID, playerName, data: { displayName: playerName } });
    seats.push({ matchID, playerID, playerName, credential: joined.playerCredentials });
  }
  await lobby.updatePlayer(gameName, matchID, { playerID: '0', credentials: seats[0].credential, data: { displayName: 'Alice', started: true } });
  const [{ host_user_id: host }] = (await admin.query('select host_user_id from matches where match_id = $1', [matchID])).rows;
  console.log(`member-hosted match ${matchID} stored with host ${host}`);

  const clients = seats.map((seat) => Client({
    game, matchID, playerID: seat.playerID, credentials: seat.credential, multiplayer: SocketIO({ server: GAME }),
  }));
  clients.forEach((client) => client.start());
  await until(() => clients.every((client) => client.getState()?.isConnected), 15_000, 'clients');

  // The database refuses the end-game write and its retry.
  await admin.query(`revoke update on matches from ${role}`);
  clients[0].events.endGame({ winners: ['0'] });
  await until(() => clients.every((client) => client.getState()?.ctx.gameover), 15_000, 'game over');
  const status = async () => (await fetch(`${GAME}/games/${gameName}/${matchID}/persistence`).then((r) => r.json())).endGameUnsaved;
  await until(status, 15_000, 'unsaved status');
  console.log('end-game write and retry failed; status endGameUnsaved=true');
  clients.forEach((client) => client.stop());

  browser = await chromium.launch();
  const shoot = async (name, { seat, width, height, mobile = false }) => {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    if (seat) {
      await context.addInitScript((saved) => {
        localStorage.setItem(`open-star-ter-village.match-credentials.${saved.matchID}`, JSON.stringify(saved));
      }, seat);
    }
    const page = await context.newPage();
    await page.goto(`${WEB}/game/${matchID}`);
    const warning = page.getByTestId('endgame-persist-warning');
    await warning.waitFor({ timeout: 20_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.screenshot({ path: path.join(OUT, name) });
    console.log(`${name}: warning visible, horizontal overflow ${overflow}px`);
    return { context, page };
  };
  const desktop = await shoot('endgame-persist-failed-desktop.png', { seat: seats[0], width: 1280, height: 900 });
  const mobile = await shoot('endgame-persist-failed-mobile.png', { seat: seats[1], width: 390, height: 844, mobile: true });
  const observer = await shoot('endgame-persist-failed-observer.png', { width: 1280, height: 900 });
  await mobile.context.close();
  await observer.context.close();

  // A later background retry lands: the warning clears.
  await admin.query(`grant update on matches to ${role}`);
  await until(async () => !(await status()), 120_000, 'background retry');
  await desktop.page.getByTestId('endgame-persist-warning').waitFor({ state: 'detached', timeout: 15_000 });
  await desktop.page.screenshot({ path: path.join(OUT, 'endgame-persist-cleared-desktop.png') });
  const [row] = (await admin.query('select is_gameover, result from matches where match_id = $1', [matchID])).rows;
  console.log(`endgame-persist-cleared-desktop.png: retry persisted is_gameover=${row.is_gameover} result=${JSON.stringify(row.result)}`);
  await desktop.context.close();
} finally {
  await browser?.close();
  for (const child of children) child.kill('SIGTERM');
  await sleep(1_500);
  await admin.end();
  const cleanup = new PgClient({ connectionString: baseUrl });
  await cleanup.connect();
  await cleanup.query(`drop database if exists ${dbName} with (force)`);
  await cleanup.query(`drop role if exists ${role}`);
  await cleanup.end();
}
