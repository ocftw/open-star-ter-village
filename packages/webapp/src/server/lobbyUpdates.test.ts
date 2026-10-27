import type { AddressInfo } from 'node:net';
import { Server } from 'boardgame.io/server';
import { registerLobbyUpdates } from './lobbyUpdates';

const gameName = 'live-lobby-test';

test('two lobby clients receive room lifecycle changes and reconnect resynchronizes', async () => {
  const server = Server({ games: [{ name: gameName, setup: () => ({}) }], origins: ['http://localhost'] });
  const dispose = registerLobbyUpdates(server);
  const running = await server.run(0);
  const base = `http://localhost:${(running.appServer.address() as AddressInfo).port}`;
  const aborts: AbortController[] = [];
  async function connect() {
    const controller = new AbortController();
    aborts.push(controller);
    const response = await fetch(`${base}/lobby/updates`, { signal: controller.signal });
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const reader = response.body!.getReader();
    let buffered = '';
    return async () => {
      while (!buffered.includes('\n\n')) {
        const part = await reader.read();
        if (part.done) throw new Error('Lobby stream closed');
        buffered += new TextDecoder().decode(part.value);
      }
      const index = buffered.indexOf('\n\n');
      const frame = buffered.slice(0, index);
      buffered = buffered.slice(index + 2);
      expect(frame).toContain('data: changed');
      expect(frame).not.toMatch(/credentials|playerName|players/);
    };
  }
  async function post(path: string, body: unknown) {
    const response = await fetch(`${base}/games/${gameName}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    expect(response.status).toBe(200);
    return response.json();
  }
  try {
    const clients = await Promise.all([connect(), connect()]);
    await Promise.all(clients.map(next => next()));
    const started = Date.now();
    const { matchID } = await post('/create', { numPlayers: 3 });
    await Promise.all(clients.map(next => next()));
    expect(Date.now() - started).toBeLessThan(1000);
    const { playerCredentials } = await post(`/${matchID}/join`, { playerID: '0', playerName: 'Host' });
    await Promise.all(clients.map(next => next()));
    await post(`/${matchID}/update`, { playerID: '0', credentials: playerCredentials, data: { started: true } });
    await Promise.all(clients.map(next => next()));
    const { nextMatchID } = await post(`/${matchID}/playAgain`, { playerID: '0', credentials: playerCredentials });
    await Promise.all(clients.map(next => next()));
    const matches = await (await fetch(`${base}/games/${gameName}`)).json();
    expect(matches.matches.map((m: { matchID: string }) => m.matchID)).toContain(nextMatchID);
    await post(`/${matchID}/leave`, { playerID: '0', credentials: playerCredentials });
    await Promise.all(clients.map(next => next()));
    const reconnect = await connect();
    await reconnect();
    const after = await (await fetch(`${base}/games/${gameName}`)).json();
    expect(after.matches.map((m: { matchID: string }) => m.matchID)).not.toContain(matchID);
  } finally {
    aborts.forEach(controller => controller.abort());
    dispose();
    running.appServer.closeAllConnections();
    await new Promise<void>(resolve => running.appServer.close(() => resolve()));
  }
}, 15_000);
