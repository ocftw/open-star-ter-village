import type { AddressInfo } from 'node:net';
import { Server, Origins } from 'boardgame.io/server';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import game from './game';
import { ADD_BOT_PATH, REMOVE_BOT_PATH, addBotHandler, removeBotHandler } from './botSeats';
import { socketPresence, startBotRunner } from './botRunner';
import { createProfileBot } from './game/bots/profileBot';
import { NOVICE } from './game/bots/profiles';
import { activePlayer } from './game/bots/runner';
import { seededRandom } from './game/bots/random';
import { BOT_STRATEGIES } from './game/bots/strategies';
import type { ClientGameState } from './game/store/store';

jest.setTimeout(90_000);

const gameName = game.name!;
const server = Server({ games: [game], origins: [Origins.LOCALHOST] });
server.router.post(ADD_BOT_PATH, addBotHandler(server.db, gameName));
server.router.post(REMOVE_BOT_PATH, removeBotHandler(server.db, gameName));
let running: Awaited<ReturnType<typeof server.run>>;
let url = '';
let lobby: LobbyClient;

beforeAll(async () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  running = await server.run({ port: 0 });
  url = `http://localhost:${(running.appServer.address() as AddressInfo).port}`;
  lobby = new LobbyClient({ server: url });
});
afterAll(() => server.kill(running));

async function room(numPlayers: number, ruleset?: string) {
  const { matchID } = await lobby.createMatch(gameName, { numPlayers, ...(ruleset ? { setupData: { ruleset } } : {}) });
  const host = await lobby.joinMatch(gameName, matchID, { playerID: '0', playerName: 'Host' });
  return { matchID, credentials: host.playerCredentials };
}

const post = (path: string, body: unknown) =>
  fetch(`${url}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('bot seat endpoints', () => {
  test('the host seats a named bot whose credential stays on the server', async () => {
    const { matchID, credentials } = await room(3, 'tree-poc-v1');
    const response = await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 2, strategy: 'novice' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ seat: 2, name: BOT_STRATEGIES.novice.names[0], strategy: 'novice' });
    const second = await (await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 1 })).json();
    expect(second.name).toBe(BOT_STRATEGIES.novice.names[1]);

    const match = await lobby.getMatch(gameName, matchID);
    expect(match.players[2]).toMatchObject({ name: BOT_STRATEGIES.novice.names[0], data: { bot: { strategy: 'novice' } } });
    expect(match.players[2]).not.toHaveProperty('credentials');
  });

  test('the host can seat a advance bot under its own names', async () => {
    const { matchID, credentials } = await room(2, 'tree-poc-v1');
    const response = await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 1, strategy: 'advance' });
    expect(await response.json()).toEqual({ seat: 1, name: BOT_STRATEGIES.advance.names[0], strategy: 'advance' });
  });

  test.each([
    ['a non-host', { playerID: '1', credentials: 'x', seat: 1 }, 403],
    ['a wrong host credential', { playerID: '0', credentials: 'wrong', seat: 1 }, 403],
    ['the host seat', { seat: 0 }, 400],
    ['a seat outside the room', { seat: 5 }, 400],
    ['an unknown strategy', { seat: 1, strategy: 'cheater' }, 400],
  ])('rejects %s', async (_, body, status) => {
    const { matchID, credentials } = await room(2, 'tree-poc-v1');
    const response = await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, ...body });
    expect(response.status).toBe(status);
  });

  test('rejects taken seats, Simplified rooms and started games', async () => {
    const taken = await room(2, 'tree-poc-v1');
    await lobby.joinMatch(gameName, taken.matchID, { playerID: '1', playerName: 'Guest' });
    expect((await post(`/games/${gameName}/${taken.matchID}/bots`, { playerID: '0', credentials: taken.credentials, seat: 1 })).status).toBe(409);

    const simple = await room(3);
    expect((await post(`/games/${gameName}/${simple.matchID}/bots`, { playerID: '0', credentials: simple.credentials, seat: 1 })).status).toBe(400);

    const started = await room(2, 'tree-poc-v1');
    await lobby.updatePlayer(gameName, started.matchID, { playerID: '0', credentials: started.credentials, data: { started: true } });
    expect((await post(`/games/${gameName}/${started.matchID}/bots`, { playerID: '0', credentials: started.credentials, seat: 1 })).status).toBe(409);
  });

  test('the host removes a bot, but cannot remove a human', async () => {
    const { matchID, credentials } = await room(3, 'tree-poc-v1');
    await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 1 });
    await lobby.joinMatch(gameName, matchID, { playerID: '2', playerName: 'Guest' });
    expect((await post(`/games/${gameName}/${matchID}/bots/2/remove`, { playerID: '0', credentials })).status).toBe(409);
    expect((await post(`/games/${gameName}/${matchID}/bots/1/remove`, { playerID: '1', credentials })).status).toBe(403);
    expect((await post(`/games/${gameName}/${matchID}/bots/1/remove`, { playerID: '0', credentials })).status).toBe(200);
    const match = await lobby.getMatch(gameName, matchID);
    expect(match.players[1].name).toBeUndefined();
    expect(match.players[1].data).toBeUndefined();
    expect(match.players[2].name).toBe('Guest');
  });
});

describe('bot runner', () => {
  /** Live sockets the server has registered for a seat. */
  const liveSockets = (matchID: string, playerID: string) =>
    Array.from((server.transport as unknown as { clientInfo: Map<string, { matchID: string; playerID: string }> }).clientInfo.values())
      .filter(client => client.matchID === matchID && client.playerID === playerID).length;

  /** Connects a client for a seat and waits until the server has registered its socket. */
  const connect = async (matchID: string, playerID: string, credentials: string) => {
    const before = liveSockets(matchID, playerID);
    const client = Client({ game, multiplayer: SocketIO({ server: url, socketOpts: { transports: ['websocket'] } }), matchID, playerID, credentials, debug: false });
    client.start();
    for (let i = 0; i < 200 && liveSockets(matchID, playerID) <= before; i++) await new Promise(r => setTimeout(r, 20));
    return client;
  };

  test('runs bots only while a human is connected, and stops them when the match is terminated', async () => {
    const { matchID, credentials } = await room(3, 'tree-poc-v1');
    await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 1 });
    const guest = await lobby.joinMatch(gameName, matchID, { playerID: '2', playerName: 'Guest' });
    const runner = startBotRunner({ db: server.db, game, serverURL: url, isPlayerConnected: socketPresence(server.transport), pollMs: 60_000, moveDelayMs: 60_000, log: () => {} });
    let host: ReturnType<typeof Client> | undefined;
    try {
      await runner.tick();
      expect(runner.activeSeats()).toEqual([]);
      await lobby.updatePlayer(gameName, matchID, { playerID: '0', credentials, data: { started: true } });
      await runner.tick();
      expect(runner.activeSeats()).toEqual([]);
      host = await connect(matchID, '0', credentials);
      await runner.tick();
      expect(runner.activeSeats()).toEqual([`${matchID}:1`]);
      await lobby.leaveMatch(gameName, matchID, { playerID: '2', credentials: guest.playerCredentials });
      await runner.tick();
      expect(runner.activeSeats()).toEqual([]);
      expect((await lobby.getMatch(gameName, matchID)).players[0].name).toBe('Host');
    } finally {
      host?.stop();
      runner.stop();
    }
  });

  test('keeps bots running when one of a human\'s sockets closes but another is live', async () => {
    const { matchID, credentials } = await room(2, 'tree-poc-v1');
    await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 1 });
    await lobby.updatePlayer(gameName, matchID, { playerID: '0', credentials, data: { started: true } });
    const tab1 = await connect(matchID, '0', credentials);
    const tab2 = await connect(matchID, '0', credentials);
    const runner = startBotRunner({ db: server.db, game, serverURL: url, isPlayerConnected: socketPresence(server.transport), pollMs: 60_000, moveDelayMs: 60_000, log: () => {} });
    let tab1Open = true;
    let tab2Open = true;
    try {
      tab1.stop();
      tab1Open = false;
      // boardgame.io marks the seat disconnected on any socket close.
      for (let i = 0; i < 200 && (await lobby.getMatch(gameName, matchID)).players[0].isConnected; i++) await new Promise(r => setTimeout(r, 20));
      expect((await lobby.getMatch(gameName, matchID)).players[0].isConnected).toBe(false);
      await runner.tick();
      expect(runner.activeSeats()).toEqual([`${matchID}:1`]);
      tab2.stop();
      tab2Open = false;
      for (let i = 0; i < 200 && liveSockets(matchID, '0') > 0; i++) await new Promise(r => setTimeout(r, 20));
      await runner.tick();
      expect(runner.activeSeats()).toEqual([]);
    } finally {
      if (tab1Open) tab1.stop();
      if (tab2Open) tab2.stop();
      runner.stop();
    }
  });

  test('deletes a room once only bots are left in it', async () => {
    const { matchID, credentials } = await room(3, 'tree-poc-v1');
    await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 1 });
    await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 2 });
    await lobby.leaveMatch(gameName, matchID, { playerID: '0', credentials });
    await expect(lobby.getMatch(gameName, matchID)).resolves.toBeDefined();
    const runner = startBotRunner({ db: server.db, game, serverURL: url, isPlayerConnected: socketPresence(server.transport), pollMs: 60_000, log: () => {} });
    try {
      await runner.tick();
      await expect(lobby.getMatch(gameName, matchID)).rejects.toThrow(/404/);
    } finally {
      runner.stop();
    }
  });

  test('stops running bots and deletes the room when the last human leaves mid-game', async () => {
    const { matchID, credentials } = await room(2, 'tree-poc-v1');
    await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 1 });
    await lobby.updatePlayer(gameName, matchID, { playerID: '0', credentials, data: { started: true } });
    const host = await connect(matchID, '0', credentials);
    const runner = startBotRunner({ db: server.db, game, serverURL: url, isPlayerConnected: socketPresence(server.transport), pollMs: 60_000, moveDelayMs: 60_000, log: () => {} });
    try {
      await runner.tick();
      expect(runner.activeSeats()).toEqual([`${matchID}:1`]);
      for (let i = 0; i < 200 && liveSockets(matchID, '1') === 0; i++) await new Promise(r => setTimeout(r, 20));
      expect(liveSockets(matchID, '1')).toBe(1);
      // The bot must already be disconnected when the match is deleted.
      let seatsAtWipe: string[] | undefined;
      const wipe = server.db.wipe.bind(server.db);
      const spy = jest.spyOn(server.db, 'wipe').mockImplementation((id: string) => {
        seatsAtWipe = runner.activeSeats();
        return wipe(id);
      });
      await lobby.leaveMatch(gameName, matchID, { playerID: '0', credentials });
      await runner.tick();
      spy.mockRestore();
      expect(seatsAtWipe).toEqual([]);
      expect(runner.activeSeats()).toEqual([]);
      await expect(lobby.getMatch(gameName, matchID)).rejects.toThrow(/404/);
    } finally {
      host.stop();
      runner.stop();
    }
  });

  test('ignores a player seat that only claims to be a bot', async () => {
    const { matchID, credentials } = await room(2, 'tree-poc-v1');
    await lobby.joinMatch(gameName, matchID, { playerID: '1', playerName: 'Sneaky', data: { bot: { strategy: 'novice' } } });
    expect((await post(`/games/${gameName}/${matchID}/bots/1/remove`, { playerID: '0', credentials })).status).toBe(409);
    await lobby.updatePlayer(gameName, matchID, { playerID: '0', credentials, data: { started: true } });
    const host = await connect(matchID, '0', credentials);
    const runner = startBotRunner({ db: server.db, game, serverURL: url, isPlayerConnected: socketPresence(server.transport), pollMs: 60_000, log: () => {} });
    try {
      await runner.tick();
      expect(runner.activeSeats()).toEqual([]);
      await expect(lobby.getMatch(gameName, matchID)).resolves.toBeDefined();
    } finally {
      host.stop();
      runner.stop();
    }
  });

  test.each(Object.keys(BOT_STRATEGIES))('a server %s bot plays its seat to the end of a Standard game against a human seat', async strategy => {
    const { matchID, credentials } = await room(2, 'tree-poc-v1');
    await post(`/games/${gameName}/${matchID}/bots`, { playerID: '0', credentials, seat: 1, strategy });
    await lobby.updatePlayer(gameName, matchID, { playerID: '0', credentials, data: { started: true } });

    const runner = startBotRunner({ db: server.db, game, serverURL: url, isPlayerConnected: socketPresence(server.transport), pollMs: 50, moveDelayMs: 0, log: () => {} });
    const host = await connect(matchID, '0', credentials);
    const hostBot = createProfileBot(NOVICE);
    const random = seededRandom(matchID);
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let botMoves = 0;
    let lastStateID = -1;
    try {
      await runner.tick();
      expect(runner.activeSeats()).toEqual([`${matchID}:1`]);
      for (let i = 0; i < 4000; i++) {
        const state = host.getState();
        if (state?.ctx.gameover) break;
        if (state?.isConnected && state._stateID !== lastStateID && activePlayer(state.ctx) === '0') {
          lastStateID = state._stateID;
          const action = hostBot.decide({ view: state.G as unknown as ClientGameState, ctx: state.ctx, playerID: '0', random });
          (host.moves as Record<string, (...args: unknown[]) => void>)[action.move](...action.args);
        } else if (state && state._stateID !== lastStateID && activePlayer(state.ctx) === '1') {
          lastStateID = state._stateID;
          botMoves++;
        }
        await wait(10);
      }
      const final = host.getState()!;
      expect(final.ctx.gameover).toBeDefined();
      expect(final.G.standard!.round).toBe(7);
      expect(botMoves).toBeGreaterThan(5);
      await runner.tick();
      expect(runner.activeSeats()).toEqual([]);
    } finally {
      host.stop();
      runner.stop();
    }
  });
});
