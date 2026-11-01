import type { AddressInfo } from 'node:net';
import { Server } from 'boardgame.io/server';
import { OpenStarTerVillage } from '@/game/game';

test('the lobby API creates and rematches only 2 to 4 player matches (#455)', async () => {
  const server = Server({ games: [OpenStarTerVillage], origins: ['http://localhost'] });
  const running = await server.run(0);
  const base = `http://localhost:${(running.appServer.address() as AddressInfo).port}/games/${OpenStarTerVillage.name}`;
  const post = (path: string, body: object) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  const create = (numPlayers: number) => post('/create', { numPlayers }).then(response => response.status);
  const playAgain = async (numPlayers: number) => {
    const { matchID } = await (await post('/create', { numPlayers: 2 })).json();
    const { playerCredentials } = await (await post(`/${matchID}/join`, { playerID: '0', playerName: 'Host' })).json();
    const response = await post(`/${matchID}/playAgain`, { playerID: '0', credentials: playerCredentials, numPlayers });
    return response.status;
  };
  try {
    expect(await Promise.all([1, 2, 3, 4, 5].map(create))).toEqual([400, 200, 200, 200, 400]);
    expect(await Promise.all([1, 2, 4, 5].map(playAgain))).toEqual([400, 200, 200, 400]);
  } finally {
    running.appServer.closeAllConnections();
    await new Promise<void>(resolve => running.appServer.close(() => resolve()));
  }
}, 15_000);
