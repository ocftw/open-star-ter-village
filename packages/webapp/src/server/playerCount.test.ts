import type { AddressInfo } from 'node:net';
import { Server } from 'boardgame.io/server';
import { OpenStarTerVillage } from '@/game/game';

test('the lobby API creates matches for 2 to 4 players only (#455)', async () => {
  const server = Server({ games: [OpenStarTerVillage], origins: ['http://localhost'] });
  const running = await server.run(0);
  const base = `http://localhost:${(running.appServer.address() as AddressInfo).port}`;
  const create = (numPlayers: number) =>
    fetch(`${base}/games/${OpenStarTerVillage.name}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numPlayers }),
    }).then(response => response.status);
  try {
    expect(await Promise.all([1, 2, 3, 4, 5].map(create))).toEqual([400, 200, 200, 200, 400]);
  } finally {
    running.appServer.closeAllConnections();
    await new Promise<void>(resolve => running.appServer.close(() => resolve()));
  }
}, 15_000);
