import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { OpenStarTerVillage } from '../src/game/game';

/**
 * #445 DB-C9: the end-game persist warning inside the 遊戲結束 dialog.
 *
 * This dev server runs without a database (persistence off), so the guest
 * table here really reports `endGameUnsaved: false`. The unsaved case is
 * driven by answering the dialog's status request the way a member-hosted
 * server does after the end-game write and its retry failed; the real
 * PostgreSQL path is covered by postgres.integration.test.ts and the
 * docs/evidence/issue-445/capture.mjs production capture.
 */
const gameName = 'OpenStarTerVillage';
const server = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;
const lobby = new LobbyClient({ server });
const ZH = '對局結果未能儲存。遊戲已結束，但這次紀錄可能無法在伺服器重啟後恢復。';
const EN = 'The end-game result could not be saved. The game has ended, but this record may not survive a server restart.';

async function finishedMatch() {
  const { matchID } = await lobby.createMatch(gameName, { numPlayers: 2 });
  const seats = await Promise.all(['Alice', 'Bob'].map(async (playerName, index) => {
    const playerID = String(index);
    const joined = await lobby.joinMatch(gameName, matchID, { playerID, playerName });
    return { matchID, playerID, playerName, credential: joined.playerCredentials };
  }));
  await lobby.updatePlayer(gameName, matchID, { playerID: '0', credentials: seats[0].credential, data: { started: true } });
  const clients = seats.map(seat => Client({
    game: OpenStarTerVillage, matchID, playerID: seat.playerID, credentials: seat.credential, multiplayer: SocketIO({ server }),
  }));
  clients.forEach(client => client.start());
  await expect.poll(() => clients.every(client => client.getState()?.isConnected)).toBe(true);
  clients[0].events.endGame!({ winners: ['0'] });
  await expect.poll(() => clients.every(client => Boolean(client.getState()?.ctx.gameover))).toBe(true);
  clients.forEach(client => client.stop());
  return { matchID, seats };
}

/** Answer the dialog's status poll; returns a switch for later retries. */
async function persistenceStatus(context: BrowserContext, matchID: string, unsaved: boolean) {
  const state = { unsaved };
  await context.route(`**/games/${gameName}/${matchID}/persistence`, route =>
    route.fulfill({ json: { endGameUnsaved: state.unsaved }, headers: { 'access-control-allow-origin': '*' } }));
  return state;
}

async function expectWarningLayout(page: Page) {
  const dialog = page.getByLabel('遊戲結束');
  const warning = dialog.getByTestId('endgame-persist-warning');
  await expect(warning).toBeVisible({ timeout: 15_000 });
  await expect(warning).toHaveAttribute('role', 'alert');
  await expect(warning).toContainText('⚠');
  await expect(warning).toContainText(ZH);
  await expect(warning).toContainText(EN);
  const warningBox = (await warning.boundingBox())!;
  const titleBox = (await dialog.getByRole('heading', { name: '遊戲結束' }).boundingBox())!;
  const trophyBox = (await dialog.getByText('🏆').boundingBox())!;
  expect(warningBox.y + warningBox.height).toBeLessThanOrEqual(trophyBox.y);
  expect(trophyBox.y).toBeLessThan(titleBox.y);
  // Unchanged buttons stay visible.
  await expect(dialog.getByRole('button', { name: /回大廳/ })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /關閉，查看最終盤面/ })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test('every seat and observer sees the unsaved end-game warning, which clears after a later retry', async ({ browser }) => {
  test.setTimeout(120_000);
  const { matchID, seats } = await finishedMatch();
  const alice = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const mobileObserver = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await alice.addInitScript(saved => {
      localStorage.setItem(`open-star-ter-village.match-credentials.${saved.matchID}`, JSON.stringify(saved));
    }, seats[0]);
    const aliceStatus = await persistenceStatus(alice, matchID, true);
    const observerStatus = await persistenceStatus(mobileObserver, matchID, true);

    const alicePage = await alice.newPage();
    await alicePage.goto(`/game/${matchID}`);
    await expectWarningLayout(alicePage);
    await expect(alicePage.getByTestId('play-again')).toBeVisible();
    await alicePage.screenshot({ path: 'test-results/endgame-persist-warning-desktop.png' });

    const observerPage = await mobileObserver.newPage();
    await observerPage.goto(`/game/${matchID}`);
    await expectWarningLayout(observerPage);
    await observerPage.screenshot({ path: 'test-results/endgame-persist-warning-observer-mobile.png', fullPage: true });

    // Reconnect while still unsaved: the warning comes back.
    await alicePage.reload();
    await expectWarningLayout(alicePage);

    // A later retry persists the result: the warning clears on the next poll.
    aliceStatus.unsaved = false;
    observerStatus.unsaved = false;
    await expect(alicePage.getByTestId('endgame-persist-warning')).toHaveCount(0, { timeout: 10_000 });
    await expect(observerPage.getByTestId('endgame-persist-warning')).toHaveCount(0, { timeout: 10_000 });

    // Buttons still work: close to inspect the board, and leave for the lobby.
    await alicePage.getByLabel('遊戲結束').getByRole('button', { name: /關閉，查看最終盤面/ }).click();
    await expect(alicePage.getByLabel('遊戲結束')).toHaveCount(0);
    await observerPage.getByLabel('遊戲結束').getByRole('button', { name: /回大廳/ }).click();
    await expect(observerPage).toHaveURL(/\/lobby$/);
  } finally {
    await Promise.all([alice, mobileObserver].map(context => context.close()));
  }
});

test('a guest-hosted table never shows the warning', async ({ browser }) => {
  test.setTimeout(90_000);
  const { matchID, seats } = await finishedMatch();
  const context = await browser.newContext();
  try {
    await context.addInitScript(saved => {
      localStorage.setItem(`open-star-ter-village.match-credentials.${saved.matchID}`, JSON.stringify(saved));
    }, seats[1]);
    const page = await context.newPage();
    const status = page.waitForResponse(response => response.url().endsWith(`/${matchID}/persistence`));
    await page.goto(`/game/${matchID}`);
    await expect(page.getByLabel('遊戲結束').getByText(/Alice 獲勝/)).toBeVisible({ timeout: 15_000 });
    expect(await (await status).json()).toEqual({ endGameUnsaved: false });
    await page.waitForTimeout(3_500);
    await expect(page.getByTestId('endgame-persist-warning')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
