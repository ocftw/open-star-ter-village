import { test, expect } from '@playwright/test';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { OpenStarTerVillage } from '../src/game/game';

const gameName = 'OpenStarTerVillage';
const server = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;
const lobby = new LobbyClient({ server });

test('observers 繼續觀戰 into the next room and can pick an open seat there (#373)', async ({ browser }) => {
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
  const dana = await browser.newContext();
  const eve = await browser.newContext();
  const mobileObserver = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  try {
    clients.forEach(client => client.start());
    await expect.poll(() => clients.every(client => client.getState()?.isConnected)).toBe(true);
    clients[0].events.endGame!({ winners: ['0'] });
    await expect.poll(() => clients.every(client => Boolean(client.getState()?.ctx.gameover))).toBe(true);

    await alice.addInitScript(seat => {
      localStorage.setItem(`open-star-ter-village.match-credentials.${seat.matchID}`, JSON.stringify(seat));
    }, seats[0]);
    // Observers' names are remembered from the lobby page.
    await dana.addInitScript(() => localStorage.setItem('open-star-ter-village.player-name', 'Dana'));
    await eve.addInitScript(() => localStorage.setItem('open-star-ter-village.player-name', 'Eve'));

    const alicePage = await alice.newPage();
    await alicePage.goto(`/game/${matchID}`);
    await expect(alicePage.getByTestId('play-again')).toBeVisible();

    // Dana arms 繼續觀戰 before the next room exists.
    const danaPage = await dana.newPage();
    await danaPage.goto(`/game/${matchID}`);
    await expect(danaPage.getByTestId('observer-mode-banner')).toBeVisible({ timeout: 15_000 });
    const danaWatch = danaPage.getByTestId('observer-watch');
    await expect(danaWatch).toContainText('繼續觀戰');
    await expect(danaPage.getByTestId('play-again')).toHaveCount(0);
    await expect(danaPage.getByRole('button', { name: /回大廳/ })).toBeEnabled();
    await danaWatch.click();
    await expect(danaWatch).toHaveAttribute('aria-pressed', 'true');
    await expect(danaPage.getByTestId('observer-waiting')).toContainText('等待玩家開啟下一局房間');
    await danaPage.waitForTimeout(3_500);
    await expect(danaWatch).toHaveAttribute('aria-pressed', 'true');
    await expect(danaPage.getByTestId('observer-waiting')).toBeVisible();
    await danaPage.screenshot({ path: 'test-results/observer-watch-armed-desktop.png', fullPage: true });

    const mobilePage = await mobileObserver.newPage();
    await mobilePage.goto(`/game/${matchID}`);
    await mobilePage.getByTestId('observer-watch').click({ timeout: 15_000 });
    await expect(mobilePage.getByTestId('observer-waiting')).toBeVisible();
    await mobilePage.screenshot({ path: 'test-results/observer-watch-armed-mobile.png', fullPage: true });

    // Eve watches without arming.
    const evePage = await eve.newPage();
    await evePage.goto(`/game/${matchID}`);
    const eveWatch = evePage.getByTestId('observer-watch');
    await expect(eveWatch).toContainText('繼續觀戰', { timeout: 15_000 });

    await alicePage.getByTestId('play-again').click();
    await expect(alicePage).not.toHaveURL(new RegExp(`${matchID}$`));
    const nextURL = alicePage.url();
    const nextMatchID = nextURL.split('/').pop()!;

    // Armed observers move in on their own, as observers.
    await expect(danaPage).toHaveURL(nextURL, { timeout: 10_000 });
    await expect(danaPage.getByText(/選一個空位坐下/)).toBeVisible();
    await expect(mobilePage).toHaveURL(nextURL, { timeout: 10_000 });

    // Eve's button turns into 加入觀戰 and moves her in on click.
    await expect(eveWatch).toContainText('加入觀戰', { timeout: 10_000 });
    await expect(evePage).toHaveURL(new RegExp(`${matchID}$`));
    await evePage.screenshot({ path: 'test-results/observer-watch-join-desktop.png', fullPage: true });
    await eveWatch.click();
    await expect(evePage).toHaveURL(nextURL);

    // Bob and Carol did not come back; Dana picks seat 2, not the first free one.
    await expect(danaPage.getByTestId('seat-0-sit')).toHaveCount(0);
    await expect(danaPage.getByTestId('seat-1-sit')).toBeVisible();
    await danaPage.screenshot({ path: 'test-results/observer-seat-pick-desktop.png', fullPage: true });
    await danaPage.getByTestId('seat-2-sit').click();
    await expect(danaPage.getByText(/你的座位是 Seat 2/)).toBeVisible();
    let next = await lobby.getMatch(gameName, nextMatchID);
    expect(next.players.find(player => player.id === 2)?.name).toBe('Dana');
    expect(next.players.find(player => player.id === 1)?.name).toBeUndefined();

    // Bob fills the last seat from the lobby; Eve stays an observer through the start.
    await lobby.joinMatch(gameName, nextMatchID, { playerID: '1', playerName: 'Bob' });
    await expect(evePage.getByTestId('seat-1-filled')).toBeVisible({ timeout: 10_000 });
    await expect(evePage.getByTestId('seat-2-filled')).toBeVisible();
    await alicePage.getByRole('button', { name: /開始遊戲/ }).click({ timeout: 10_000 });
    await expect(evePage.getByTestId('observer-mode-banner')).toBeVisible({ timeout: 15_000 });
    next = await lobby.getMatch(gameName, nextMatchID);
    expect(next.players.map(player => player.name)).toEqual(['Alice', 'Bob', 'Dana']);
  } finally {
    clients.forEach(client => client.stop());
    await Promise.all([alice, dana, eve, mobileObserver].map(context => context.close()));
  }
});
