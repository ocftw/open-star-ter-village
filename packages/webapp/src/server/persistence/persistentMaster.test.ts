import fs from 'node:fs';
import path from 'node:path';
import type { Game } from 'boardgame.io';
import * as Sentry from '@sentry/node';
import { createMatch } from 'boardgame.io/internal';
import { FakeMatchesSql } from './fakeMatchesSql';
import { hostIdentity } from './hostToken';
import { MemberPostgresStore } from './memberStore';
import { PersistentMaster } from './persistentMaster';

jest.mock('@sentry/node', () => ({ captureException: jest.fn() }));

const SEAT_SECRET = 'seat-credential-sentinel-c7';

const counter: Game<{ n: number }> = {
  name: 'counter',
  setup: () => ({ n: 0 }),
  moves: { bump: ({ G }) => { G.n += 1; } },
};

async function setup() {
  const sql = new FakeMatchesSql();
  const store = new MemberPostgresStore({
    databaseUrl: 'postgres://unused@127.0.0.1:1/unused',
    resumeWindowHours: 24,
    endGameRetryDelaysMs: [],
    sql,
  });
  await store.connect();
  const match = createMatch({ game: counter, numPlayers: 2, unlisted: false, setupData: undefined });
  if ('setupDataError' in match) throw new Error('setup');
  match.metadata.players[0].credentials = `${SEAT_SECRET}-0`;
  match.metadata.players[0].name = 'Alice';
  await hostIdentity.run({ userId: 'member-1' }, () => store.createMatch('m1', match));

  const order: string[] = [];
  const update = sql.update.bind(sql);
  sql.update = async (tx, row) => {
    order.push(`write:${row.state_id}`);
    return update(tx, row);
  };
  const sent: { playerID: string | null; type: string; args: unknown[] }[] = [];
  const transport = {
    send: jest.fn((data: { playerID: string | null; type: string; args: unknown[] }) => { sent.push(data); }),
    sendAll: jest.fn((payload: { type: string; args: unknown[] }) => { order.push(`broadcast:${payload.type}`); }),
  };
  const master = new PersistentMaster(counter, store, transport as never, undefined);
  const bump = (stateID: number) =>
    master.onUpdate({ type: 'MAKE_MOVE', payload: { type: 'bump', args: [], playerID: '0', credentials: `${SEAT_SECRET}-0` } } as never, stateID, 'm1', '0');
  return { sql, store, transport, order, sent, bump };
}

let logs: string[];
beforeEach(() => {
  logs = [];
  jest.mocked(Sentry.captureException).mockClear();
  for (const level of ['warn', 'error', 'info', 'log'] as const) {
    jest.spyOn(console, level).mockImplementation((...args: unknown[]) => { logs.push(JSON.stringify(args)); });
  }
});
afterEach(() => jest.restoreAllMocks());

describe('PersistentMaster (DB-C7, DB-P9)', () => {
  it('attempts the write before broadcasting the move', async () => {
    const { bump, order, store } = await setup();
    await bump(0);
    expect(order).toEqual(['write:1', 'broadcast:update']);
    expect((await store.fetch('m1', { state: true })).state.G).toEqual({ n: 1 });
  });

  it('publishes a move whose write failed transiently, and writes the latest state next time (DB-C8)', async () => {
    const { bump, order, sql, transport } = await setup();
    sql.failNext(1);
    await expect(bump(0)).resolves.toBeUndefined();
    expect(transport.sendAll).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['broadcast:update']);
    await bump(1);
    expect(order).toEqual(['broadcast:update', 'write:2', 'broadcast:update']);
    expect(sql.rows.get('m1')!.state_id).toBe(2);
  });

  it('never publishes a hard _stateID reject; it sends the mover an authoritative sync and reports it', async () => {
    const { bump, sql, transport, sent } = await setup();
    await bump(0);
    transport.sendAll.mockClear();
    // Another writer is ahead in PostgreSQL.
    const row = sql.rows.get('m1')!;
    row.state_id = 9;
    (row.state as { G: { n: number }; _stateID: number }).G = { n: 42 };
    (row.state as { _stateID: number })._stateID = 9;

    await expect(bump(1)).resolves.toEqual({ error: 'stale state rejected' });
    expect(transport.sendAll).not.toHaveBeenCalled();
    const sync = sent.find((message) => message.type === 'sync')!;
    expect(sync.playerID).toBe('0');
    const [matchID, syncInfo] = sync.args as [string, { state: { G: unknown; _stateID: number }; filteredMetadata: object[] }];
    expect(matchID).toBe('m1');
    expect(syncInfo.state).toMatchObject({ G: { n: 42 }, _stateID: 9 });
    expect(JSON.stringify(syncInfo.filteredMetadata)).not.toContain(SEAT_SECRET);

    const operations = jest.mocked(Sentry.captureException).mock.calls.map(([, hint]) =>
      (hint as { tags: { operation: string } }).tags.operation);
    expect(operations).toContain('stale-state-rejected');
    expect(JSON.stringify(jest.mocked(Sentry.captureException).mock.calls)).not.toContain(SEAT_SECRET);
    expect(logs.join('\n')).not.toContain(SEAT_SECRET);
  });
});

describe('no boardgame.io library patch (DB-C7)', () => {
  const root = path.resolve(__dirname, '../../../../..');

  it('has no boardgame.io patch in patches/ or the lockfile', () => {
    const patchesDir = path.join(root, 'patches');
    const patches = fs.existsSync(patchesDir) ? fs.readdirSync(patchesDir) : [];
    expect(patches.filter((name) => name.includes('boardgame.io'))).toEqual([]);
    const lockfile = fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8');
    const patchedSection = lockfile.split('\npatchedDependencies:')[1]?.split('\n\n')[0] ?? '';
    expect(patchedSection).not.toContain('boardgame.io');
    const workspace = fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
    expect(workspace).not.toMatch(/boardgame\.io[^\n]*\.patch/);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      pnpm?: { patchedDependencies?: Record<string, string> };
    };
    expect(Object.keys(manifest.pnpm?.patchedDependencies ?? {}).filter((name) => name.startsWith('boardgame.io'))).toEqual([]);
  });
});
