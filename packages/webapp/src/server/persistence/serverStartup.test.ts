import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function startup(overrides: Record<string, string | undefined>) {
  const scratch = mkdtempSync(path.join(tmpdir(), 'rfc009-startup-'));
  const preload = path.join(scratch, 'sentry.cjs');
  // Observe the actual entry point without sending events to an external service.
  writeFileSync(preload, `
    const Module = require('node:module');
    const load = Module._load;
    Module._load = function(id, ...args) {
      if (id === '@sentry/node') return {
        init() {}, flush: async () => true,
        captureException(error) { console.error('SENTRY_CAPTURE', error.message); },
      };
      return load.call(this, id, ...args);
    };
  `);
  try {
    return spawnSync(process.execPath, ['-r', preload, '-r', 'ts-node/register/transpile-only',
      '-r', 'tsconfig-paths/register', 'src/server.ts'], {
      cwd: path.resolve(__dirname, '../../..'), encoding: 'utf8', timeout: 15000,
      env: { ...process.env, TS_NODE_PROJECT: 'tsconfig.server.json', NODE_ENV: 'production',
        NEXT_PUBLIC_GAME_SERVER_URL: 'http://localhost:14510', GAME_SERVER_ORIGINS: 'http://localhost:14510',
        PORT: '14510', DATABASE_URL: 'postgres://private-db-secret', SENTRY_DSN: 'test-only', ...overrides },
    });
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}

it.each([
  [{ MATCH_PERSISTENCE: 'Member' }, 'MATCH_PERSISTENCE must be member or off'],
  [{ MATCH_PERSISTENCE: 'member', MATCH_RESUME_WINDOW_HOURS: 'private-window-secret' },
    'MATCH_RESUME_WINDOW_HOURS must be a positive number'],
])('logs and reports the safe persistence configuration reason: %j', (env, reason) => {
  const result = startup(env);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(`Game server startup failed: ${reason}`);
  expect(result.stderr).toContain(`SENTRY_CAPTURE ${reason}`);
  expect(result.stderr).not.toContain('private-db-secret');
  expect(result.stderr).not.toContain('private-window-secret');
});

it('keeps unclassified startup errors out of logs and Sentry', () => {
  const result = startup({ PORT: 'private-port-secret', MATCH_PERSISTENCE: 'off' });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('Game server startup failed');
  expect(result.stderr).toContain('SENTRY_CAPTURE Game server startup failed');
  expect(result.stderr).not.toContain('private-port-secret');
});
