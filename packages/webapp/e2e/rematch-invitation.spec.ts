import { test, expect } from '@playwright/test';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { OpenStarTerVillage } from '../src/game/game';

const gameName = 'OpenStarTerVillage';
const server = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;
const lobby = new LobbyClient({ server });

test('finished players discover, dismiss, recover and join one shared rematch', async ({ browser }) => {
  test.setTimeout(120_000);
  const { matchID } = await lobby.createMatch(gameName, { numPlayers: 3 });
  const seats = await Promise.all(['Alice', 'Bob', 'Carol'].map(async (playerName, index) => {
    const playerID = String(index);
    const joined = await lobby.joinMatch(gameName, matchID, { playerID, playerName });
    return { matchID, playerID, playerName, credential: joined.playerCredentials };
  }));
  await lobby.updatePlayer(gameName, matchID, {playerID:'0',credentials:seats[0].credential,data:{started:true}});
  const clients = seats.map(seat => Client({game:OpenStarTerVillage, matchID, playerID:seat.playerID, credentials:seat.credential, multiplayer:SocketIO({server})}));
  const contexts = await Promise.all(seats.map(() => browser.newContext()));
  try {
    clients.forEach(client => client.start());
    await expect.poll(() => clients.every(client => client.getState()?.isConnected)).toBe(true);
    // Seed the terminal state through boardgame.io's authoritative event API.
    // This isolates rematch behavior from final-round scoring/event handling.
    clients[0].events.endGame!({winners:['0']});
    await expect.poll(() => clients.every(client => Boolean(client.getState()?.ctx.gameover))).toBe(true);
    const pages = await Promise.all(contexts.map(async (context, index) => {
      await context.addInitScript(seat => localStorage.setItem(`open-star-ter-village.match-credentials.${seat.matchID}`, JSON.stringify(seat)), seats[index]);
      const page = await context.newPage();
      await page.goto(`/game/${matchID}`);
      await expect(page.getByTestId('play-again')).toBeVisible();
      return page;
    }));
    // Bob is looking at the final board when Alice creates the next game.
    await pages[1].getByText(/關閉，查看最終盤面/).click();
    await pages[1].screenshot({path:'test-results/rematch-before-desktop.png',fullPage:true});
    await pages[0].getByTestId('play-again').click();
    await expect(pages[0]).not.toHaveURL(new RegExp(`${matchID}$`));
    const nextURL = pages[0].url();
    await expect(pages[1].getByTestId('rematch-invitation')).toBeVisible({timeout:10_000});
    await expect(pages[1].getByTestId('play-again')).toContainText('加入下一局');
    await pages[1].getByTestId('play-again').click();
    await expect(pages[1]).toHaveURL(nextURL);
    // Carol can keep inspecting results, then recover the invitation after refresh.
    await expect(pages[2].getByTestId('rematch-invitation')).toBeVisible();
    await pages[2].getByText(/關閉，查看最終盤面/).click();
    await expect(pages[2].getByTestId('rematch-invitation')).toHaveCount(0);
    await expect(pages[2]).toHaveURL(new RegExp(`${matchID}$`));
    await pages[2].reload();
    await expect(pages[2].getByTestId('rematch-invitation')).toBeVisible();
    await pages[2].screenshot({path:'test-results/rematch-invitation-desktop.png',fullPage:true});
    await pages[2].getByTestId('play-again').click();
    await expect(pages[2]).toHaveURL(nextURL);
    const next = await lobby.getMatch(gameName, nextURL.split('/').pop()!);
    expect(next.players.map(player => player.name).sort()).toEqual(['Alice','Bob','Carol']);
  } finally {
    clients.forEach(client => client.stop());
    await Promise.all(contexts.map(context => context.close()));
  }
});
