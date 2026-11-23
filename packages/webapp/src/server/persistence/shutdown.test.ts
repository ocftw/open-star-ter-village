import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import type { Game } from 'boardgame.io';
import { issueTestHostToken } from './testHostToken';

jest.setTimeout(60_000);
const webapp = path.resolve(__dirname, '../../..');
const counter: Game<{ n: number }> = { name: 'counter', setup: () => ({ n: 0 }), moves: { bump: ({ G }) => { G.n += 1; } } };

function waitForLine(child: ReturnType<typeof spawn>, prefix: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();
      const line = buffer.split('\n').find((candidate) => candidate.startsWith(prefix));
      if (line) {
        child.stdout!.off('data', onData);
        resolve(line);
      }
    };
    child.stdout!.on('data', onData);
    child.once('exit', () => reject(new Error(`exited before ${prefix}: ${buffer}`)));
  });
}

describe('graceful shutdown (DB-C6)', () => {
  it('on SIGTERM mid-write, finishes the in-flight and pending latest-state writes, then exits in time', async () => {
    const secret = randomBytes(32).toString('base64url');
    const child = spawn(process.execPath, [
      '-r', 'ts-node/register/transpile-only', '-r', 'tsconfig-paths/register', 'src/server/persistence/shutdownFixture.ts',
    ], {
      cwd: webapp,
      env: { ...process.env, TS_NODE_PROJECT: 'tsconfig.server.json', FIXTURE_SECRET: secret, FIXTURE_WRITE_DELAY_MS: '800' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const port = Number((await waitForLine(child, 'READY ')).split(' ')[1]);
    const server = `http://localhost:${port}`;
    const lobby = new LobbyClient({ server });
    const token = await issueTestHostToken(new TextEncoder().encode(secret), { sub: 'member-1' });
    const { matchID } = await lobby.createMatch('counter', { numPlayers: 2 }, { headers: { Authorization: `Bearer ${token}` } });
    const { playerCredentials } = await lobby.joinMatch('counter', matchID, { playerID: '0', playerName: 'Alice' });
    const client = Client({ game: counter, matchID, playerID: '0', credentials: playerCredentials, multiplayer: SocketIO({ server }) });
    client.start();
    await new Promise<void>((resolve) => { const t = setInterval(() => { if (client.getState()?.isConnected) { clearInterval(t); resolve(); } }, 10); });
    await new Promise((resolve) => setTimeout(resolve, 100));

    child.kill('SIGUSR2'); // slow writes from here on
    await new Promise((resolve) => setTimeout(resolve, 100));
    client.moves.bump(); // write in flight
    client.moves.bump(); // queued: the pending latest state
    await new Promise((resolve) => setTimeout(resolve, 150));
    const exitLine = waitForLine(child, 'EXIT ');
    const signalledAt = Date.now();
    child.kill('SIGTERM');
    const [, code, rows] = /^EXIT (\d+) (.*)$/.exec(await exitLine)!;
    const elapsed = Date.now() - signalledAt;
    client.stop();

    expect(code).toBe('0');
    expect(JSON.parse(rows)).toEqual([{ id: matchID, stateID: 2 }]);
    expect(elapsed).toBeGreaterThan(500); // it waited for the slow writes
    expect(elapsed).toBeLessThan(5_000); // and stayed under Fly's default kill_timeout
  });
});

describe('start-production.sh (DB-A4)', () => {
  it('forwards SIGTERM to both children and waits for them before exiting', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'osv-start-'));
    const log = path.join(root, 'log');
    const stub = (name: string) => `
      const fs = require('fs');
      fs.appendFileSync(${JSON.stringify(log)}, '${name}:start\\n');
      process.on('SIGTERM', () => {
        fs.appendFileSync(${JSON.stringify(log)}, '${name}:TERM\\n');
        setTimeout(() => { fs.appendFileSync(${JSON.stringify(log)}, '${name}:exit\\n'); process.exit(0); }, 300);
      });
      setInterval(() => {}, 1000);`;
    fs.mkdirSync(path.join(root, 'packages/webapp/dist/src'), { recursive: true });
    fs.writeFileSync(path.join(root, 'packages/webapp/server.js'), stub('next'));
    fs.writeFileSync(path.join(root, 'packages/webapp/dist/src/server.js'), stub('game'));
    fs.writeFileSync(path.join(root, 'packages/webapp/register-dist-alias.js'), '');

    const shell = spawn('sh', [path.join(webapp, 'scripts/start-production.sh')], { cwd: root, stdio: 'ignore' });
    const read = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '');
    const until = async (check: () => boolean) => {
      const end = Date.now() + 10_000;
      while (!check()) {
        if (Date.now() > end) throw new Error(`timeout: ${read()}`);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    };
    await until(() => read().includes('next:start') && read().includes('game:start'));
    const exited = new Promise<number | null>((resolve) => shell.once('exit', (code) => resolve(code)));
    shell.kill('SIGTERM');
    const code = await exited;
    const lines = read();
    expect(code).toBe(0);
    expect(lines).toContain('next:TERM');
    expect(lines).toContain('game:TERM');
    // The script exited only after both children finished their shutdown work.
    expect(lines).toContain('next:exit');
    expect(lines).toContain('game:exit');
    fs.rmSync(root, { recursive: true, force: true });
  });
});
