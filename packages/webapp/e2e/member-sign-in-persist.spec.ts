import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { Pool } from 'pg';
import { verifyHostToken, readHostTokenSecret } from '../src/server/persistence/hostToken';
import { dismissRoundStartOverlay } from './devTools';

const gameName = 'OpenStarTerVillage';
const sharedGameOrigin = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;
const restartPort = '3592';
const gameOrigin = `http://localhost:${restartPort}`;
const games = `${gameOrigin}/games/${gameName}`;
const databaseUrl = process.env.TEST_DATABASE_URL;

function startGameServer(baseURL: string, databaseUrl: string) {
  const child = spawn(process.execPath, [
    '-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register', 'src/server.ts',
  ], {
    env: {
      ...process.env,
      TS_NODE_PROJECT: 'tsconfig.server.json',
      DATABASE_URL: databaseUrl,
      GAME_SERVER_ORIGINS: baseURL,
      NEXT_PUBLIC_GAME_SERVER_URL: gameOrigin,
      PORT: restartPort,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  const exited = new Promise<number | null>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  return {
    async ready() {
      await expect.poll(() => output.includes('Match persistence: on'), { timeout: 20_000 }).toBe(true);
      const health = await fetch(`${gameOrigin}/health`);
      expect(await health.json()).toMatchObject({ persistence: 'on' });
    },
    memberHostReported: () => output.includes('Match create verified a member host'),
    guestHostReported: () => output.includes('Match created without a verified member host'),
    async stop() {
      child.kill('SIGTERM');
      expect(await exited).toBe(0);
    },
  };
}

async function useRestartableServer(page: Page) {
  await page.route(`${sharedGameOrigin}/**`, (route) => route.continue({
    url: gameOrigin + route.request().url().slice(sharedGameOrigin.length),
  }));
  // HTTP polling already targets the isolated server. Block upgrades to the shared one.
  await page.routeWebSocket(`${sharedGameOrigin.replace('http:', 'ws:')}/**`, (socket) => socket.close());
}

async function evidence(page: Page, file: string) {
  const directory = process.env.MEMBER_EVIDENCE_DIR;
  if (directory) await page.screenshot({ path: join(directory, file), animations: 'disabled' });
}

async function createMatch(page: Page) {
  await page.getByRole('group', { name: /players/i }).getByRole('button', { name: '2', exact: true }).click();
  await page.getByRole('button', { name: /建立房間/ }).click();
  await expect(page).toHaveURL(/\/game\/[^/]+$/);
  return new URL(page.url()).pathname.split('/').at(-1)!;
}

test('member sign-in persists a played move across a game-server restart', async ({ page, browser, baseURL }) => {
  test.setTimeout(100_000);
  if (!databaseUrl) {
    expect(process.env.E2E_REQUIRE_DB, 'TEST_DATABASE_URL is required when E2E_REQUIRE_DB=1').not.toBe('1');
    test.skip(true, 'Set TEST_DATABASE_URL to run the real PostgreSQL member flow');
    return;
  }
  const hostSecret = readHostTokenSecret(process.env.GAME_SERVER_AUTH_SECRET);
  if (!process.env.AUTH_SECRET || process.env.AUTH_TEST_LOGIN !== '1' || !hostSecret) {
    throw new Error('The PostgreSQL member flow requires AUTH_TEST_LOGIN=1 and throwaway AUTH_SECRET and GAME_SERVER_AUTH_SECRET values.');
  }
  const db = new Pool({ connectionString: databaseUrl });
  const guest = await browser.newContext({ baseURL });
  const guestPage = await guest.newPage();
  const nickname = '星村旅人';
  let memberId: string | undefined;
  let matchId: string | undefined;
  let server = startGameServer(baseURL!, databaseUrl);

  try {
    await server.ready();
    await useRestartableServer(page);
    await useRestartableServer(guestPage);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/lobby');
    await expect(page.getByText('Sign in to keep this game safe', { exact: false })).toBeVisible();
    expect((await page.request.get('/api/game-token')).status()).toBe(401);
    await evidence(page, 'guest-lobby.png');
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page.getByRole('button', { name: /sign in with/i })).toHaveCount(0);
    await page.getByRole('button', { name: /test sign in/i }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    const session = await page.request.get('/api/auth/session');
    expect(session.status()).toBe(200);
    memberId = (await session.json()).user.id;
    expect((await page.request.get('/api/game-token')).status()).toBe(401);
    const optIn = page.getByRole('checkbox', { name: /send me ocf news and teaching materials/i });
    await expect(optIn).not.toBeChecked();
    const field = page.getByRole('textbox', { name: /nickname/i });
    // A blank (whitespace-only) nickname is rejected and shown as an error.
    await page.setViewportSize({ width: 390, height: 844 });
    await field.fill('   ');
    await page.getByRole('button', { name: /save and continue/i }).click();
    await expect(page).toHaveURL(/\/onboarding\?error=nickname$/);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    const nicknameError = page.locator('#nickname-error');
    await expect(nicknameError).toBeVisible();
    await expect(nicknameError).toHaveClass(/member-error/);
    const optInRow = (await page.locator('label.member-opt-in').boundingBox())!;
    expect(optInRow.height).toBeGreaterThanOrEqual(44);
    await expect(optIn).not.toBeChecked();
    await evidence(page, 'onboarding-nickname-error.png');
    await page.setViewportSize({ width: 1280, height: 900 });
    await field.fill(nickname);
    await evidence(page, 'onboarding.png');
    await page.getByRole('button', { name: /save and continue/i }).click();
    await expect(page).toHaveURL(/\/lobby$/);
    await expect(page.getByTestId('app-header')).toContainText(nickname);
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    const { rows: members } = await db.query(
      'select nickname, marketing_opt_in, consent_version, opt_in_at from users where id = $1', [memberId],
    );
    expect(members).toEqual([{
      nickname, marketing_opt_in: false, consent_version: expect.any(String), opt_in_at: expect.any(Date),
    }]);
    await evidence(page, 'member-lobby.png');

    const tokenResponse = await page.request.get('/api/game-token');
    expect(tokenResponse.status()).toBe(200);
    const { token, expiresAt } = await tokenResponse.json();
    expect(expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(await verifyHostToken(token, hostSecret)).toEqual({ userId: memberId });

    matchId = await createMatch(page);
    const storedMatch = async () => (await db.query(
      'select host_user_id, state_id, state from matches where match_id = $1', [matchId],
    )).rows[0];
    expect((await storedMatch())?.host_user_id).toBe(memberId);
    await expect.poll(server.memberHostReported).toBe(true);
    const joined = await page.request.post(`${games}/${matchId}/join`, {
      data: { playerID: '1', playerName: '同行旅人' },
    });
    expect(joined.status()).toBe(200);
    await page.getByRole('button', { name: /start game/i }).click();
    await dismissRoundStartOverlay(page);
    const host = page.getByTestId(`ranking-row-${nickname}`);
    await expect(host).toBeVisible();
    const beforeActions = Number(await host.getAttribute('data-actions'));
    const beforeMove = await storedMatch();
    await page.getByTestId('refill-jobs').click();
    await page.locator('[data-testid^="job-remove-"]').first().click();
    await page.getByTestId('ca-confirm').click();
    const afterActions = String(beforeActions - 1);
    await expect(host).toHaveAttribute('data-actions', afterActions);
    const afterMove = await storedMatch();
    expect(afterMove.state_id).toBeGreaterThan(beforeMove.state_id);

    await guestPage.goto('/lobby');
    await guestPage.getByLabel(/player name/i).fill('訪客村長');
    const guestTokenCalls: string[] = [];
    guestPage.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/game-token') guestTokenCalls.push(request.url());
    });
    const guestMatch = await createMatch(guestPage);
    expect(guestTokenCalls).toEqual([]);
    expect((await guestPage.request.get(`${games}/${guestMatch}`)).status()).toBe(200);
    const guestRows = await db.query('select 1 from matches where match_id = $1', [guestMatch]);
    expect(guestRows.rowCount).toBe(0);
    await expect.poll(server.guestHostReported).toBe(true);

    // A navigation releases the playing client's socket. Reload from the same browser seat after restart.
    await page.goto('/lobby');
    await server.stop();
    server = startGameServer(baseURL!, databaseUrl);
    await server.ready();
    expect((await guestPage.request.get(`${games}/${guestMatch}`)).status()).toBe(404);
    await page.goto(`/game/${matchId}`);
    await dismissRoundStartOverlay(page);
    await expect(host).toHaveAttribute('data-actions', afterActions);
    expect(await storedMatch()).toEqual(afterMove);
    await evidence(page, 'restored-match.png');

    await page.goto('/lobby');
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    expect((await page.request.get('/api/game-token')).status()).toBe(401);
  } finally {
    try {
      await guest.close();
      await page.close();
      await server.stop();
    } finally {
      try {
        if (matchId) await db.query('delete from matches where match_id = $1', [matchId]);
        if (memberId) await db.query('delete from users where id = $1', [memberId]);
      } finally {
        await db.end();
      }
    }
  }
});
