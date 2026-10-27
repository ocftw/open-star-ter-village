import { spawn, ChildProcess } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const pause = () => new Promise(resolve => setTimeout(resolve, 20));

async function until(check: () => boolean) {
  const deadline = Date.now() + 8000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error('Timed out waiting for child processes');
    await pause();
  }
}

describe('production launcher', () => {
  let directory: string;
  let launcher: ChildProcess;
  let children: number[];

  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'osv-launcher-'));
    children = [];
    // Real Node processes stand in for the two built entrypoints.
    writeFileSync(path.join(directory, 'node'), `#!/bin/sh\nexec '${process.execPath}' '${path.join(directory, 'child.cjs')}' "$@"\n`, { mode: 0o755 });
    writeFileSync(path.join(directory, 'child.cjs'), `
      const fs = require('node:fs');
      const file = process.env.LAUNCHER_EVENTS;
      const record = event => fs.appendFileSync(file, process.pid + ':' + event + '\\n');
      for (const signal of ['SIGTERM', 'SIGINT']) {
        process.on(signal, () => { record(signal); setTimeout(() => { record('done'); process.exit(0); }, 100); });
      }
      record('ready');
      setInterval(() => {}, 1000);
    `);
    writeFileSync(path.join(directory, 'events'), '');
    launcher = spawn('sh', [path.join(__dirname, 'start-production.sh')], {
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, LAUNCHER_EVENTS: path.join(directory, 'events') },
      stdio: 'ignore',
    });
  });

  afterEach(() => {
    launcher.kill('SIGKILL');
    for (const pid of children) {
      try { process.kill(pid, 'SIGKILL'); } catch { /* Already stopped. */ }
    }
    rmSync(directory, { recursive: true, force: true });
  });

  it.each(['SIGTERM', 'SIGINT'] as const)('forwards %s to both children and waits for them', async signal => {
    const events = () => readFileSync(path.join(directory, 'events'), 'utf8');
    await until(() => events().split(':ready').length === 3);
    children = events().trim().split('\n').map(line => Number(line.split(':')[0]));
    const exited = new Promise<number | null>(resolve => launcher.once('exit', resolve));
    launcher.kill(signal);
    expect(await exited).toBe(0);
    for (const pid of children) {
      expect(events()).toContain(`${pid}:${signal}`);
      expect(events()).toContain(`${pid}:done`);
      expect(() => process.kill(pid, 0)).toThrow();
    }
  }, 15000);
});
