import type { AddressInfo } from 'node:net';
import { Client } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { Server } from 'boardgame.io/server';
import { OpenStarTerVillage } from '@/game/game';

test('the lobby API creates, rematches, and socket-syncs only 2 to 4 player matches (#455)', async () => {
  const server = Server({ games: [OpenStarTerVillage], origins: ['http://localhost'] });
  const running = await server.run(0);
  const base = `http://localhost:${(running.appServer.address() as AddressInfo).port}/games/${OpenStarTerVillage.name}`;
  const post = (path: string, body: object) =>
    fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  // A socket client syncing an unknown match ID creates it with its raw numPlayers.
  const socketSync = async (numPlayers: number) => {
    const matchID = `socket-${numPlayers}`;
    const client = Client({
      game: OpenStarTerVillage,
      multiplayer: SocketIO({ server: base.slice(0, base.indexOf('/games')) }),
      matchID,
      playerID: '0',
      numPlayers,
    });
    client.start();
    try {
      for (let attempt = 0; attempt < 50 && !client.getState(); attempt++) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      const { state } = await server.db.fetch(matchID, { state: true });
      return state !== undefined;
    } finally {
      client.stop();
    }
  };
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
    expect(await Promise.all([1, 2, 2.5, 3.5, 4, 5].map(socketSync))).toEqual([false, true, false, false, true, false]);
  } finally {
    running.appServer.closeAllConnections();
    await new Promise<void>(resolve => running.appServer.close(() => resolve()));
  }
}, 15_000);
