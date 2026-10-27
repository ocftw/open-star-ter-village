import { fork, ChildProcess, execFile } from 'node:child_process';
import { createServer, createConnection, Socket } from 'node:net';
import { promisify } from 'node:util';
import path from 'node:path';
import { Pool } from 'pg';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { createHmac } from 'node:crypto';
import game from '@/game';

const { simultaneousGame } = require('./integration.fixture.cjs');
const integration = process.env.DATABASE_URL ? describe : describe.skip;
const secret = 'test-host-secret-used-only-by-the-integration-worker';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(check: () => boolean | Promise<boolean>, description: string, timeout = 15000) {
  const end = Date.now() + timeout;
  while (!await check()) {
    if (Date.now() > end) throw new Error(`Timed out: ${description}`);
    await delay(20);
  }
}
function hostToken(expired = false) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({ sub: 'integration-member', exp: Math.floor(Date.now() / 1000) + (expired ? -1 : 300) })).toString('base64url');
  return `${header}.${claims}.${createHmac('sha256', secret).update(`${header}.${claims}`).digest('base64url')}`;
}
async function freePort() {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  await new Promise<void>(resolve => server.close(() => resolve()));
  return port;
}

integration('running server with real PostgreSQL', () => {
  let pool: Pool;
  const workers: ChildProcess[] = [];
  const clients = new Set<ReturnType<typeof Client>>();
  function disconnect(list: ReturnType<typeof Client>[]) {
    list.forEach(client => { client.stop(); clients.delete(client); });
  }
  const matches: string[] = [];
  let sequence = 0;

  beforeAll(() => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.on('error', () => {}); // Expected when the dedicated test container is stopped.
  });
  afterAll(async () => {
    disconnect(Array.from(clients));
    workers.filter(worker => worker.exitCode === null && worker.signalCode === null).forEach(worker => worker.kill('SIGKILL'));
    if (matches.length) await pool.query('delete from matches where match_id = any($1)', [matches]);
    await pool.end();
  });

  async function start(options: { probe?: boolean; off?: boolean; url?: string; hours?: number } = {}) {
    const port = await freePort();
    const url = `http://localhost:${port}`;
    const worker = fork(path.join(__dirname, 'integration.fixture.cjs'), [], {
      cwd: path.resolve(__dirname, '../../..'),
      execArgv: ['-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register'],
      env: { ...process.env, TS_NODE_PROJECT: 'tsconfig.server.json', NODE_ENV: 'test', PORT: String(port),
        SENTRY_DSN: '', GAME_SERVER_AUTH_SECRET: secret, NEXT_PUBLIC_GAME_SERVER_URL: url,
        GAME_SERVER_ORIGINS: url, DATABASE_URL: options.url ?? process.env.DATABASE_URL,
        MATCH_PERSISTENCE: options.off ? 'off' : 'member', MATCH_RESUME_WINDOW_HOURS: String(options.hours ?? 24), PERSISTENCE_TEST_GAME: options.probe ? 'probe' : '' },
      silent: true,
    });
    workers.push(worker);
    let output = '';
    worker.stdout!.on('data', chunk => { output += chunk.toString(); });
    worker.stderr!.on('data', chunk => { output += chunk.toString(); });
    let ready = false;
    worker.on('message', message => { if ((message as {type?: string}).type === 'ready') ready = true; });
    await until(() => ready || worker.exitCode !== null, 'server startup');
    expect(worker.exitCode).toBeNull();
    async function command(type: string) {
      const id = ++sequence;
      return new Promise<unknown>((resolve, reject) => {
        const timer = setTimeout(() => { worker.off('message', receive); reject(new Error('fixture IPC timeout')); }, 15000);
        const receive = (raw: unknown) => {
          const message = raw as { id?: number; error?: string; payload?: unknown };
          if (message.id !== id) return;
          clearTimeout(timer); worker.off('message', receive);
          if (message.error) reject(new Error(message.error)); else resolve(message.payload);
        };
        worker.on('message', receive); worker.send({ id, type });
      });
    }
    async function stop(signal: NodeJS.Signals = 'SIGTERM', expectedCode = 0) {
      const exited = new Promise<number | null>(resolve => worker.once('exit', resolve));
      worker.kill(signal);
      const code = await exited;
      if (signal !== 'SIGKILL') {
        expect(code).toBe(expectedCode);
        expect(output).toContain(expectedCode === 0 ? 'Match save drain complete' : 'Match save drain timed out');
      }
    }
    return { url, worker, command, stop, output: () => output,
      lobby: new LobbyClient({ server: url }), name: options.probe ? 'PersistenceProbe' : 'OpenStarTerVillage' };
  }
  type Running = Awaited<ReturnType<typeof start>>;
  async function create(server: Running, member: boolean, token = hostToken()) {
    const response = await fetch(`${server.url}/games/${server.name}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(member ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ numPlayers: 3, hostUserId: 'forged-member' }),
    });
    expect(response.status).toBe(200);
    const { matchID } = await response.json() as { matchID: string };
    matches.push(matchID);
    return matchID;
  }
  async function seats(server: Running, matchID: string) {
    return Promise.all(['0', '1', '2'].map(async playerID => {
      const joined = await server.lobby.joinMatch(server.name, matchID, { playerID, playerName: `Player ${playerID}` });
      return { playerID, credentials: joined.playerCredentials };
    }));
  }
  async function connect(server: Running, matchID: string, credentials: Awaited<ReturnType<typeof seats>>) {
    const connected = credentials.map(seat => Client({ game: server.name === 'PersistenceProbe' ? simultaneousGame : game,
      multiplayer: SocketIO({ server: server.url }), matchID, ...seat }));
    connected.forEach(client => { clients.add(client); client.start(); });
    await until(() => connected.every(client => Boolean(client.getState()?.isConnected)), 'clients connected');
    return connected;
  }

  it('resumes the actual game at the same state ID and lets both guests move using their original credentials', async () => {
    const first = await start();
    expect((await (await fetch(`${first.url}/health`)).json()).persistence).toBe('on');
    const matchID = await create(first, true);
    const credentials = await seats(first, matchID);
    const playing = await connect(first, matchID, credentials);
    playing[0].moves.endActionTurn();
    await until(() => playing.every(client => (client.getState()?._stateID ?? 0) >= 1), 'first move');
    const stateID = playing[0].getState()!._stateID;
    disconnect(playing);
    await first.stop();
    const second = await start();
    const resumed = await connect(second, matchID, credentials);
    expect(resumed[0].getState()!._stateID).toBe(stateID);
    for (const player of ['1', '2']) {
      const before = resumed[0].getState()!._stateID;
      expect(resumed[0].getState()!.ctx.currentPlayer).toBe(player);
      resumed[Number(player)].moves.endActionTurn();
      await until(() => resumed.every(client => client.getState()!._stateID > before), 'guest next move');
    }
    const stored = await pool.query('select host_user_id,metadata from matches where match_id=$1', [matchID]);
    expect(stored.rows[0].host_user_id).toBe('integration-member');
    for (const seat of credentials) expect(stored.rows[0].metadata.players[seat.playerID].credentials).toBe(seat.credentials);
    disconnect(resumed);
    await second.stop();
  }, 45000);

  it('persists a member-hosted play-again match and restores it after restart', async () => {
    const first = await start();
    const matchID = await create(first, true);
    const { playerCredentials } = await first.lobby.joinMatch(first.name, matchID, {
      playerID: '0', playerName: 'Member host',
    });
    const response = await fetch(`${first.url}/games/${first.name}/${matchID}/playAgain`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerID: '0', credentials: playerCredentials }),
    });
    expect(response.status).toBe(200);
    const { nextMatchID } = await response.json() as { nextMatchID: string };
    matches.push(nextMatchID);
    await first.command('flush');
    const stored = await pool.query('select host_user_id from matches where match_id=$1', [nextMatchID]);
    expect(stored.rows).toEqual([{ host_user_id: 'integration-member' }]);
    await first.stop();

    const second = await start();
    expect((await fetch(`${second.url}/games/${second.name}/${nextMatchID}`)).status).toBe(200);
    await second.stop();
  }, 45000);

  it('creates guests for missing, expired, and invalid tokens; none survives a restart or has a row', async () => {
    const first = await start();
    const ids = [await create(first, false), await create(first, true, hostToken(true)), await create(first, true, 'invalid-token')];
    await first.command('flush');
    expect((await pool.query('select match_id from matches where match_id=any($1)', [ids])).rowCount).toBe(0);
    expect(first.output()).toContain('Match created without a verified member host');
    await first.stop();
    const second = await start();
    for (const id of ids) expect((await fetch(`${second.url}/games/${second.name}/${id}`)).status).toBe(404);
    await second.stop();
  }, 45000);

  it('applies simultaneous stage moves once in memory and PostgreSQL, and restores the saved state after SIGKILL', async () => {
    const first = await start({ probe: true });
    const matchID = await create(first, true);
    const credentials = await seats(first, matchID);
    const playing = await connect(first, matchID, credentials);
    playing[0].moves.act(); playing[1].moves.act();
    await until(() => playing.every(client => client.getState()!._stateID === 2), 'two simultaneous moves');
    expect(playing[0].getState()!.G.applied.slice().sort()).toEqual(['0', '1']);
    await first.command('flush');
    const saved = await pool.query('select state from matches where match_id=$1', [matchID]);
    expect(saved.rows[0].state._stateID).toBe(2);
    expect(saved.rows[0].state.G.applied.slice().sort()).toEqual(['0', '1']);
    disconnect(playing);
    await first.stop('SIGKILL');
    const second = await start({ probe: true });
    const resumed = await connect(second, matchID, credentials);
    expect(resumed[0].getState()!._stateID).toBe(2);
    resumed[2].moves.act();
    await until(() => resumed.every(client => client.getState()!._stateID === 3), 'post-crash move');
    disconnect(resumed);
    await second.stop();
  }, 45000);

  it('starts off or degraded without database access and serves guest creation normally', async () => {
    for (const [off, expected] of [[true, 'off'], [false, 'degraded']] as const) {
      const server = await start({ off, url: 'postgres://unused:unused@127.0.0.1:1/unreachable' });
      expect((await (await fetch(`${server.url}/health`)).json()).persistence).toBe(expected);
      const matchID = await create(server, true);
      expect((await server.lobby.getMatch(server.name, matchID)).matchID).toBe(matchID);
      expect((await pool.query('select match_id from matches where match_id=$1', [matchID])).rowCount).toBe(0);
      await server.stop();
    }
  }, 30000);
  it('keeps moves in memory during a database outage, reports safely to Sentry, and catches up on recovery', async () => {
    const target = new URL(process.env.DATABASE_URL!);
    const sockets = new Set<Socket>();
    let blocked = false;
    const gate = createServer(socket => {
      if (blocked) { socket.destroy(); return; }
      const upstream = createConnection({ host: target.hostname, port: Number(target.port || 5432) });
      sockets.add(socket); sockets.add(upstream);
      socket.pipe(upstream).pipe(socket);
      socket.on('error', () => upstream.destroy());
      upstream.on('error', () => socket.destroy());
      socket.on('close', () => { sockets.delete(socket); upstream.destroy(); });
      upstream.on('close', () => { sockets.delete(upstream); socket.destroy(); });
    });
    await new Promise<void>(resolve => gate.listen(0, '127.0.0.1', resolve));
    const proxied = new URL(target);
    proxied.hostname = '127.0.0.1'; proxied.port = String((gate.address() as { port: number }).port);
    const server = await start({ probe: true, url: proxied.toString() });
    const container = process.env.PERSISTENCE_TEST_DATABASE_CONTAINER;
    const docker = promisify(execFile);
    let playing: ReturnType<typeof Client>[] = [];
    try {
      const matchID = await create(server, true);
      const credentials = await seats(server, matchID);
      playing = await connect(server, matchID, credentials);
      await server.command('flush');
      if (container) await docker('docker', ['stop', container]);
      blocked = true;
      sockets.forEach(socket => socket.destroy());
      playing[0].moves.act(); playing[1].moves.act();
      await until(() => playing.every(client => client.getState()!._stateID === 2), 'play during outage');
      await until(async () => JSON.stringify(await server.command('reports')).includes('Match persistence: save'), 'Sentry save failure');
      const reports = JSON.stringify(await server.command('reports'));
      expect(reports).not.toContain(secret);
      for (const seat of credentials) expect(reports).not.toContain(seat.credentials);
      if (container) await docker('docker', ['start', container]);
      blocked = false;
      await until(async () => {
        try {
          const row = await pool.query('select state_id from matches where match_id=$1', [matchID]);
          return row.rows[0]?.state_id === 2;
        } catch { return false; }
      }, 'database catch-up after recovery');
      await server.command('flush');
      const saved = await pool.query('select state from matches where match_id=$1', [matchID]);
      expect(saved.rows[0].state.G.applied.slice().sort()).toEqual(['0', '1']);
      expect(server.output()).not.toContain(secret);
      expect(server.output()).not.toContain(proxied.password);
    } finally {
      if (container) await docker('docker', ['start', container]);
      blocked = false;
      disconnect(playing);
      if (server.worker.exitCode === null) await server.stop();
      sockets.forEach(socket => socket.destroy());
      await new Promise<void>(resolve => gate.close(() => resolve()));
    }
  }, 60000);

  it('loads the configured resume window and skips abandoned, finished, and unknown-version states', async () => {
    const first = await start({ probe: true });
    const matchID = await create(first, true);
    await first.stop();
    await pool.query("update matches set updated_at=now()-interval '30 hours' where match_id=$1", [matchID]);
    const narrow = await start({ probe: true });
    expect((await fetch(`${narrow.url}/games/${narrow.name}/${matchID}`)).status).toBe(404);
    await narrow.stop();
    const wider = await start({ probe: true, hours: 48 });
    expect((await wider.lobby.getMatch(wider.name, matchID)).matchID).toBe(matchID);
    await wider.stop();
    for (const change of ["abandoned_at=now()", "abandoned_at=null,is_gameover=true", "is_gameover=false,game_version='future'"]) {
      await pool.query(`update matches set ${change} where match_id=$1`, [matchID]);
      const filtered = await start({ probe: true, hours: 48 });
      expect((await fetch(`${filtered.url}/games/${filtered.name}/${matchID}`)).status).toBe(404);
      if (change.includes('future')) {
        expect(JSON.stringify(await filtered.command('reports'))).toContain('unknown-game-version');
      }
      await filtered.stop();
    }
  }, 30000);

  it('logs the unsaved match ID and exits on the actual shutdown deadline', async () => {
    const server = await start({ probe: true });
    const matchID = await create(server, true);
    const playing = await connect(server, matchID, await seats(server, matchID));
    await server.command('flush');
    await server.command('hold-saves');
    playing[0].moves.act();
    await until(() => playing[0].getState()!._stateID === 1, 'move before shutdown timeout');
    disconnect(playing);
    await server.stop('SIGTERM', 1);
    expect(server.output()).toContain(matchID);
    expect(server.output()).toContain('unsavedMatchIDs');
  }, 20000);

  it('keeps local p95 move latency within 10% of memory at a modeled 300 ms RTT', async () => {
    async function measure(off: boolean) {
      const server = await start({ probe: true, off });
      const matchID = await create(server, true);
      const playing = await connect(server, matchID, await seats(server, matchID));
      const measurements: number[] = [];
      for (let index = 0; index < 23; index++) {
        const before = playing[0].getState()!._stateID;
        const begin = performance.now();
        if (index >= 3) await delay(150);
        playing[0].moves.act();
        await until(() => playing[0].getState()!._stateID > before, 'latency sample');
        if (index >= 3) { await delay(150); measurements.push(performance.now() - begin); }
      }
      disconnect(playing);
      await server.stop();
      return measurements.sort((a, b) => a - b)[18];
    }
    const memoryP95Ms = await measure(true);
    const persistentP95Ms = await measure(false);
    console.info('Local latency at modeled 300 ms RTT', { memoryP95Ms, persistentP95Ms, samplesPerMode: 20 });
    expect(persistentP95Ms).toBeLessThanOrEqual(memoryP95Ms * 1.1);
  }, 40000);

});
