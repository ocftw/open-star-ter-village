import { Readable } from 'node:stream';
import type { Server } from 'boardgame.io';
import { InitializeGame } from 'boardgame.io/internal';
import { FakeMatchesSql } from './persistence/fakeMatchesSql';
import { hostIdentity } from './persistence/hostToken';
import { MemberPostgresStore } from './persistence/memberStore';
import { createRematchRules } from './rematch';

type Router = Parameters<ReturnType<typeof createRematchRules>['register']>[0];
type Handler = Parameters<Router['post']>[1];

const game = { name: 'counter', setup: () => ({}) };
const original = 'original';
const nextMatch = 'next-match';
const originalHostCredential = 'original-host-fixture';
const originalGuestCredential = 'original-guest-fixture';
const newMatch = (players: Server.MatchData['players']) => ({
  initialState: InitializeGame({ game, numPlayers: 3 }),
  metadata: { gameName: game.name, players, createdAt: Date.now(), updatedAt: Date.now() },
});

async function boot(sql: FakeMatchesSql) {
  const db = new MemberPostgresStore({
    databaseUrl: 'postgres://unused@127.0.0.1:1/unused',
    resumeWindowHours: 24,
    sql,
  });
  await db.connect();

  const posts = new Map<string, Handler>();
  createRematchRules(db).register({
    post: (path, handler) => posts.set(path, handler),
    get: () => undefined,
  });

  let credentialNumber = 0;
  async function post<T = unknown>(action: string, id: string, body: object, next?: () => Promise<T>) {
    const ctx: Parameters<Handler>[0] = {
      params: { id },
      status: 200,
      body: undefined,
      req: Readable.from([JSON.stringify(body)]),
      throw: (status) => { throw Object.assign(new Error('HTTP request rejected'), { status }); },
      app: {
        context: {
          auth: {
            authenticateCredentials: ({ playerID, credentials, metadata }) =>
              metadata.players[Number(playerID)]?.credentials === credentials,
            generateCredentials: () => `new-fixture-${++credentialNumber}`,
          },
        },
      },
    };
    await posts.get(`/games/:name/:id/${action}`)!(ctx, next ?? (async () => undefined));
    return ctx.body;
  }

  return {
    db,
    post,
    createOriginal: () => hostIdentity.run({ userId: 'original-member' }, () => db.createMatch(original, newMatch({
      0: { id: 0, name: 'Alice', credentials: originalHostCredential },
      1: { id: 1, name: 'Bob', credentials: originalGuestCredential },
      2: { id: 2 },
    }))),
    // Model the stock playAgain route's create and nextMatchID write.
    playAgain: () => post('playAgain', original, {}, async () => {
      await db.createMatch(nextMatch, newMatch({ 0: { id: 0 }, 1: { id: 1 }, 2: { id: 2 } }));
      const { metadata } = await db.fetch(original, { metadata: true });
      await db.setMetadata(original, { ...metadata, nextMatchID: nextMatch });
    }),
    join: (playerID: string, playerName: string, rematchCredentials?: string) =>
      post('join', nextMatch, { playerID, playerName, rematchCredentials }) as Promise<{ playerID: string; playerCredentials: string }>,
    decline: () => post('declineRematch', original, { playerID: '0', credentials: originalHostCredential }),
  };
}

it('requires the original host credential to claim the reserved rematch seat', async () => {
  const sql = new FakeMatchesSql();
  const server = await boot(sql);
  await server.createOriginal();
  await server.playAgain();
  await expect(server.join('0', 'Alice')).rejects.toMatchObject({ status: 403 });
  await expect(server.join('0', 'Alice', originalGuestCredential)).rejects.toMatchObject({ status: 403 });
  await expect(server.join('0', 'Alice', originalHostCredential)).resolves.toMatchObject({ playerID: '0' });
  expect(sql.rows.get(nextMatch)?.host_user_id).toBe('original-member');
  await server.db.flushAndClose();
});

it('restores the rematch reservation and member join order across restarts', async () => {
  const sql = new FakeMatchesSql();
  const first = await boot(sql);
  await first.createOriginal();
  await first.db.flushAndClose();

  const second = await boot(sql);
  await second.playAgain();
  expect(sql.rows.get(nextMatch)?.host_user_id).toBe('original-member');
  await hostIdentity.run({ userId: 'successor-member' }, () => second.join('2', 'Carol'));
  await second.db.flushAndClose();

  const third = await boot(sql);
  await expect(third.join('0', 'Alice')).rejects.toMatchObject({ status: 403 });
  await third.join('1', 'Bob');
  const { metadata } = await third.db.fetch(nextMatch, { metadata: true });
  const lobbyJSON = JSON.stringify({ ...metadata, players: [] });
  expect(lobbyJSON).not.toContain('successor-member');
  expect(lobbyJSON).not.toContain('original');
  await third.decline();
  expect(sql.rows.get(nextMatch)?.host_user_id).toBe('successor-member');
  expect((await third.db.fetch(nextMatch, { metadata: true })).metadata.players[0].name).toBe('Carol');
  await third.db.flushAndClose();
});

it('recovers only the promoted host credential after the old seat is refilled', async () => {
  const server = await boot(new FakeMatchesSql());
  await server.createOriginal();
  await server.playAgain();
  const promoted = await server.join('1', 'Bob');
  await server.decline();
  const refill = await server.join('1', 'Bob');
  await expect(server.post('rematchSeat', nextMatch, { playerID: '1', credentials: refill.playerCredentials }))
    .rejects.toMatchObject({ status: 403 });
  await expect(server.post('rematchSeat', nextMatch, { playerID: '1', credentials: promoted.playerCredentials }))
    .resolves.toEqual({ playerID: '0' });
  await server.db.flushAndClose();
});
