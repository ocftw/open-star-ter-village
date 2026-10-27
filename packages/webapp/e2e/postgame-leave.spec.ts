import { test, expect } from '@playwright/test';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { OpenStarTerVillage } from '../src/game/game';

const gameName = 'OpenStarTerVillage';
const server = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;
const lobby = new LobbyClient({ server });

test('leaving after game over preserves named results for the remaining player', async ({ browser }) => {
  test.setTimeout(90_000);
  const { matchID } = await lobby.createMatch(gameName, { numPlayers: 3 });
  const seats = await Promise.all(['Alice', 'Bob', 'Carol'].map(async (playerName, index) => {
    const playerID = String(index);
    const joined = await lobby.joinMatch(gameName, matchID, {
      playerID,
      playerName,
      data: { displayName: playerName },
    });
    return { matchID, playerID, playerName, credential: joined.playerCredentials };
  }));
  await lobby.updatePlayer(gameName, matchID, {
    playerID: '0',
    credentials: seats[0].credential,
    data: { started: true, displayName: 'Alice' },
  });

  const clients = seats.map((seat) => Client({
    game: OpenStarTerVillage,
    matchID,
    playerID: seat.playerID,
    credentials: seat.credential,
    multiplayer: SocketIO({ server }),
  }));
  const contexts = await Promise.all(seats.map(() => browser.newContext()));
  try {
    clients.forEach((client) => client.start());
    await expect.poll(() => clients.every((client) => client.getState()?.isConnected)).toBe(true);
    clients[0].events.endGame!({ winners: ['0'] });
    await expect.poll(() => clients.every((client) => Boolean(client.getState()?.ctx.gameover))).toBe(true);

    const pages = await Promise.all(contexts.map(async (context, index) => {
      await context.addInitScript((seat) => {
        localStorage.setItem(`open-star-ter-village.match-credentials.${seat.matchID}`, JSON.stringify(seat));
      }, seats[index]);
      return context.newPage();
    }));
    await Promise.all(pages.map((page) => page.goto(`/game/${matchID}`)));
    await expect(pages[0].getByText(/Alice 獲勝/)).toBeVisible();
    await pages[0].getByText(/關閉，查看最終盤面/).click();
    await pages[0].getByTestId('header-leave').click();
    await pages[0].getByTestId('exit-leave-seat').click();
    await expect(pages[0]).toHaveURL(/\/lobby$/);

    await pages[1].reload();
    await expect(pages[1].getByText(/Alice 獲勝/)).toBeVisible();
    await expect(pages[1].getByLabel('遊戲結束').getByText('Alice', { exact: true })).toBeVisible();
    await pages[1].screenshot({ path: 'test-results/postgame-results-after-leave.png', fullPage: true });
  } finally {
    clients.forEach((client) => client.stop());
    await Promise.all(contexts.map((context) => context.close()));
  }
});
