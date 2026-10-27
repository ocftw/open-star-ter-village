import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const server = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;
const game = 'OpenStarTerVillage';

test('another lobby receives room creation, start and removal, then resyncs after reconnect', async ({ browser, request }) => {
  const hostContext = await browser.newContext();
  const watcherContext = await browser.newContext();
  const host = await hostContext.newPage();
  const watcher = await watcherContext.newPage();
  const seats: {matchID: string; playerID: string; credentials: string}[] = [];
  const observations: Record<string, number> = {};
  try {
    const streamOpened = watcher.waitForResponse(response => response.url().endsWith('/lobby/updates') && response.status() === 200);
    await Promise.all([host.goto('/lobby'), watcher.goto('/lobby')]);
    await streamOpened;
    await mkdir('test-results', {recursive:true});
    await watcher.screenshot({path:'test-results/lobby-live-before.png',fullPage:true});
    await host.getByLabel(/player name/i).fill('Live lobby host');
    const created = host.waitForResponse(response => response.url().endsWith(`/games/${game}/create`) && response.status() === 200);
    await host.getByRole('button', {name:/建立房間/}).click();
    const {matchID} = await (await created).json();
    const createdAt = Date.now();
    const row = watcher.getByTestId(`match-row-${matchID}`);
    await expect(row).toBeVisible({timeout:1000});
    observations.createToVisibleMs = Date.now() - createdAt;
    await host.waitForURL(`**/game/${matchID}`);
    const hostSeat = await host.evaluate(id => JSON.parse(localStorage.getItem(`open-star-ter-village.match-credentials.${id}`)!), matchID);
    seats.push({matchID,playerID:'0',credentials:hostSeat.credential});
    for (const playerID of ['1','2']) {
      const joined = await request.post(`${server}/games/${game}/${matchID}/join`, {data:{playerID,playerName:`Guest ${playerID}`}});
      expect(joined.status()).toBe(200);
      seats.push({matchID,playerID,credentials:(await joined.json()).playerCredentials});
    }
    await host.getByRole('button', {name:/start game/i}).click();
    await expect(row.getByTestId('match-spectate')).toBeVisible({timeout:1000});
    await watcher.screenshot({path:'test-results/lobby-live.png',fullPage:true});
    await host.getByTestId('header-leave').click();
    await host.getByTestId('exit-leave-seat').click();
    await expect(row).toHaveCount(0,{timeout:1000});

    await watcherContext.setOffline(true);
    const next = await request.post(`${server}/games/${game}/create`, {data:{numPlayers:3}});
    const {matchID:nextID} = await next.json();
    const joined = await request.post(`${server}/games/${game}/${nextID}/join`, {data:{playerID:'0',playerName:'Reconnect host'}});
    seats.push({matchID:nextID,playerID:'0',credentials:(await joined.json()).playerCredentials});
    await watcherContext.setOffline(false);
    const reconnectedAt = Date.now();
    await expect(watcher.getByTestId(`match-row-${nextID}`)).toBeVisible({timeout:5000});
    observations.reconnectToVisibleMs = Date.now() - reconnectedAt;
    await writeFile('test-results/lobby-live-observation.json',JSON.stringify(observations,null,2));
  } finally {
    for (const seat of seats) await request.post(`${server}/games/${game}/${seat.matchID}/leave`, {data:{playerID:seat.playerID,credentials:seat.credentials}});
    await hostContext.close();
    await watcherContext.close();
  }
});
