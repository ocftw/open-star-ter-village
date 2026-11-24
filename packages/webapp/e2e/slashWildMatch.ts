import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { dismissRoundStartOverlay } from './devTools';

const gameServer = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;

async function post(request: APIRequestContext, route: string, data: unknown) {
  const response = await request.post(`${gameServer}/games/OpenStarTerVillage${route}`, { data });
  expect(response.ok(), `${route}: ${response.status()}`).toBeTruthy();
  return response.json();
}

/** Open a real two-player match for Alice, the first player entitled to the wild card. */
export async function openWildMatch(page: Page, request: APIRequestContext) {
  const { matchID } = await post(request, '/create', {
    numPlayers: 2,
    setupData: { forcedFirstEvent: 'ignore_first_worker_requirement' },
  });
  const { playerCredentials: credential } = await post(request, `/${matchID}/join`, {
    playerID: '0', playerName: 'Alice', data: { displayName: 'Alice' },
  });
  await post(request, `/${matchID}/join`, { playerID: '1', playerName: 'Bob', data: { displayName: 'Bob' } });
  await post(request, `/${matchID}/update`, {
    playerID: '0', credentials: credential, data: { started: true, displayName: 'Alice' },
  });

  await page.addInitScript((seat) => {
    localStorage.setItem(`open-star-ter-village.match-credentials.${seat.matchID}`, JSON.stringify(seat));
    localStorage.setItem('open-star-ter-village.player-name', seat.playerName);
  }, { matchID, playerID: '0', credential, playerName: 'Alice' });
  await page.goto(`/game/${matchID}`);
  await dismissRoundStartOverlay(page);
}
