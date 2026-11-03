import { test, expect, type Page } from '@playwright/test';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { OpenStarTerVillage } from '../src/game/game';

const gameName = 'OpenStarTerVillage';
const server = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;
const lobby = new LobbyClient({ server });

/** Close the results dialog, then reopen it from the game-over note (#478). */
async function reopenResultsFromNote(page: Page, shot: string) {
  const results = page.getByLabel('遊戲結束');
  await expect(results.getByText(/Alice 獲勝/)).toBeVisible();
  await page.getByText(/關閉，查看最終盤面/).click();
  await expect(results).toHaveCount(0);

  const note = page.getByTestId('game-over-note');
  await expect(note).toContainText('遊戲結束');
  await expect(page.getByTestId('waiting-for-player-alert')).toHaveCount(0);
  await expect(page.getByTestId('context-action')).toHaveCount(0);
  await page.screenshot({ path: `test-results/${shot}`, fullPage: true });

  await note.getByTestId('show-game-results').click();
  await expect(results.getByText(/Alice 獲勝/)).toBeVisible();
}

test('after game over, players and observers see 遊戲結束 and can reopen the results', async ({ browser }) => {
  test.setTimeout(90_000);
  const { matchID } = await lobby.createMatch(gameName, { numPlayers: 3 });
  const seats = await Promise.all(['Alice', 'Bob', 'Carol'].map(async (playerName, index) => {
    const playerID = String(index);
    const joined = await lobby.joinMatch(gameName, matchID, { playerID, playerName });
    return { matchID, playerID, playerName, credential: joined.playerCredentials };
  }));
  await lobby.updatePlayer(gameName, matchID, { playerID: '0', credentials: seats[0].credential, data: { started: true } });
  const clients = seats.map(seat => Client({
    game: OpenStarTerVillage,
    matchID,
    playerID: seat.playerID,
    credentials: seat.credential,
    multiplayer: SocketIO({ server }),
  }));
  // Alice (still the current player) and Bob hold seats; the observers have no credentials.
  const alice = await browser.newContext();
  const bob = await browser.newContext();
  const observer = await browser.newContext();
  const mobileObserver = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  try {
    clients.forEach(client => client.start());
    await expect.poll(() => clients.every(client => client.getState()?.isConnected)).toBe(true);
    clients[0].events.endGame!({ winners: ['0'] });
    await expect.poll(() => clients.every(client => Boolean(client.getState()?.ctx.gameover))).toBe(true);

    for (const [context, seat] of [[alice, seats[0]], [bob, seats[1]]] as const) {
      await context.addInitScript(saved => {
        localStorage.setItem(`open-star-ter-village.match-credentials.${saved.matchID}`, JSON.stringify(saved));
      }, seat);
      const page = await context.newPage();
      await page.goto(`/game/${matchID}`);
      await reopenResultsFromNote(page, `gameover-note-${seat.playerName.toLowerCase()}-desktop.png`);
      await expect(page.getByTestId('play-again')).toBeVisible();
    }

    const mobilePage = await mobileObserver.newPage();
    await mobilePage.goto(`/game/${matchID}`);
    await expect(mobilePage.getByTestId('observer-mode-banner')).toBeVisible({ timeout: 15_000 });
    await expect(mobilePage.getByTestId('mobile-sheet').getByTestId('game-over-note')).toBeVisible();
    await reopenResultsFromNote(mobilePage, 'gameover-note-observer-mobile.png');

    const observerPage = await observer.newPage();
    await observerPage.goto(`/game/${matchID}`);
    await expect(observerPage.getByTestId('observer-mode-banner')).toBeVisible({ timeout: 15_000 });
    await reopenResultsFromNote(observerPage, 'gameover-note-observer-desktop.png');
    // Play again needs a seat; observers can still leave from the results.
    await expect(observerPage.getByTestId('play-again')).toHaveCount(0);
    await observerPage.getByRole('button', { name: /回大廳/ }).click();
    await expect(observerPage).toHaveURL(/\/lobby$/);
  } finally {
    clients.forEach(client => client.stop());
    await Promise.all([alice, bob, observer, mobileObserver].map(context => context.close()));
  }
});
