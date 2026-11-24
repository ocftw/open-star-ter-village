/**
 * Test-only child process for shutdown.test.ts: a member-persistence game
 * server on a slow fake database, with the production signal handler.
 */
import type { Game } from 'boardgame.io';
import { exitOnSignals, startGameServer } from '../gameServer';
import { FakeMatchesSql } from './fakeMatchesSql';

const counter: Game<{ n: number }> = {
  name: 'counter',
  minPlayers: 2,
  maxPlayers: 2,
  setup: () => ({ n: 0 }),
  moves: { bump: ({ G }) => { G.n += 1; } },
};

async function main() {
  const sql = new FakeMatchesSql();
  const running = await startGameServer({
    games: [counter],
    port: 0,
    origins: [],
    env: {
      MATCH_PERSISTENCE: 'member',
      DATABASE_URL: 'postgres://unused@127.0.0.1:1/unused',
      GAME_SERVER_AUTH_SECRET: process.env.FIXTURE_SECRET,
    },
    storeOverrides: { sql },
  });
  process.on('exit', (code) => {
    const rows = Array.from(sql.rows.values()).map((row) => ({ id: row.match_id, stateID: row.state_id }));
    process.stdout.write(`EXIT ${code} ${JSON.stringify(rows)}\n`);
  });
  exitOnSignals(running);
  // Slow every write from now on so SIGTERM lands mid-write.
  process.on('SIGUSR2', () => { sql.writeDelayMs = Number(process.env.FIXTURE_WRITE_DELAY_MS ?? 800); });
  process.stdout.write(`READY ${running.port}\n`);
}

void main();
