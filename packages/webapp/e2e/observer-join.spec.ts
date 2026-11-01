import { test, expect } from '@playwright/test';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { OpenStarTerVillage } from '../src/game/game';

const gameName = 'OpenStarTerVillage';
const server = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;
const lobby = new LobbyClient({ server });

test('an observer can 加入遊戲 only after a player opens the next room (#373)', async ({ browser }) => {
  test.setTimeout(120_000);
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
  const alice = await browser.newContext();
  const observer = await browser.newContext();
  const mobileObserver = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  try {
    clients.forEach(client => client.start());
    await expect.poll(() => clients.every(client => client.getState()?.isConnected)).toBe(true);
    clients[0].events.endGame!({ winners: ['0'] });
    await expect.poll(() => clients.every(client => Boolean(client.getState()?.ctx.gameover))).toBe(true);

    await alice.addInitScript(seat => {
      localStorage.setItem(`open-star-ter-village.match-credentials.${seat.matchID}`, JSON.stringify(seat));
    }, seats[0]);
    // The observer's lobby name is remembered from the lobby page.
    for (const context of [observer, mobileObserver]) {
      await context.addInitScript(() => localStorage.setItem('open-star-ter-village.player-name', 'Dana'));
    }
    const alicePage = await alice.newPage();
    await alicePage.goto(`/game/${matchID}`);
    await expect(alicePage.getByTestId('play-again')).toBeVisible();

    const observerPage = await observer.newPage();
    await observerPage.goto(`/game/${matchID}`);
    await expect(observerPage.getByTestId('observer-mode-banner')).toBeVisible({ timeout: 15_000 });
    const join = observerPage.getByTestId('observer-join');
    await expect(join).toBeDisabled();
    await expect(observerPage.getByText(/等待玩家開啟下一局房間/)).toBeVisible();
    await expect(observerPage.getByTestId('play-again')).toHaveCount(0);
    await expect(observerPage.getByRole('button', { name: /回大廳/ })).toBeEnabled();
    await observerPage.screenshot({ path: 'test-results/observer-join-disabled-desktop.png', fullPage: true });

    const mobilePage = await mobileObserver.newPage();
    await mobilePage.goto(`/game/${matchID}`);
    await expect(mobilePage.getByTestId('observer-join')).toBeDisabled({ timeout: 15_000 });

    await alicePage.getByTestId('play-again').click();
    await expect(alicePage).not.toHaveURL(new RegExp(`${matchID}$`));
    const nextURL = alicePage.url();
    const nextMatchID = nextURL.split('/').pop()!;

    await expect(join).toBeEnabled({ timeout: 10_000 });
    await expect(observerPage.getByTestId('rematch-invitation')).toContainText('可以加入遊戲了');
    await observerPage.screenshot({ path: 'test-results/observer-join-enabled-desktop.png', fullPage: true });
    await expect(mobilePage.getByTestId('observer-join')).toBeEnabled({ timeout: 10_000 });
    await mobilePage.screenshot({ path: 'test-results/observer-join-enabled-mobile.png', fullPage: true });

    await join.click();
    await expect(observerPage).toHaveURL(nextURL);
    await expect(observerPage.getByText(/你的座位是 Seat 1/)).toBeVisible();
    const next = await lobby.getMatch(gameName, nextMatchID);
    expect(next.players.find(player => player.id === 1)?.name).toBe('Dana');
  } finally {
    clients.forEach(client => client.stop());
    await Promise.all([alice, observer, mobileObserver].map(context => context.close()));
  }
});
