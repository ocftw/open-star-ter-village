import type { Game } from 'boardgame.io';
import { Origins, Server } from 'boardgame.io/server';
import packageJson from '../../package.json';
import { hostIdentityMiddleware } from './persistence/hostToken';
import { createPersistence, type Persistence } from './persistence';
import type { MemberStoreOptions } from './persistence/memberStore';
import { shutdownGracefully } from './persistence/shutdown';
import { registerLobbyUpdates } from './lobbyUpdates';
import { createRematchRules } from './rematch';

export interface GameServerOptions {
  games: Game[];
  port: number;
  origins: string[];
  env?: Record<string, string | undefined>;
  /** Test seam for store timings and fault injection. */
  storeOverrides?: Partial<MemberStoreOptions>;
  rematchHostGraceMs?: number;
  callback?: () => void;
}

export interface RunningGameServer {
  server: ReturnType<typeof Server>;
  persistence: Persistence;
  port: number;
  /** Graceful stop: no new connections, finish moves and writes. True when nothing was left unsaved. */
  stop(timeoutMs?: number): Promise<boolean>;
}

/** End-game persistence status for one match; polled by the 遊戲結束 dialog. */
export interface MatchPersistenceStatus {
  endGameUnsaved: boolean;
}

export async function startGameServer(options: GameServerOptions): Promise<RunningGameServer> {
  const persistence = createPersistence(options.env ?? process.env, options.storeOverrides);
  const gameName = options.games[0]?.name;

  const server = Server({
    games: options.games,
    ...(persistence.store ? { db: persistence.store } : {}),
    ...(persistence.transport ? { transport: persistence.transport } : {}),
    origins: [
      ...options.origins,
      // Allow localhost to connect, except when NODE_ENV is 'production'.
      Origins.LOCALHOST_IN_DEVELOPMENT,
    ],
  });

  registerLobbyUpdates(server);
  server.app.use(hostIdentityMiddleware(persistence.hostTokenSecret));

  // boardgame.io's playAgain read-check-create-write is not atomic. The
  // rematch rules serialize playAgain (so concurrent players receive the same
  // next match), joins into rematch rooms, and host declines.
  createRematchRules(persistence.store ?? {}, { hostGraceMs: options.rematchHostGraceMs })
    .register(server.router as unknown as Parameters<ReturnType<typeof createRematchRules>['register']>[0]);

  server.router.get('/games/:name/:id/persistence', (ctx) => {
    const body: MatchPersistenceStatus = { endGameUnsaved: persistence.endGameUnsaved(ctx.params.id) };
    ctx.body = body;
  });

  server.router.get('/health', (ctx) => {
    ctx.status = 200;
    ctx.body = {
      status: 'ok',
      persistence: persistence.status(),
      uptime: process.uptime(),
      version: packageJson.version,
      gameName,
    };
  });

  const servers = await server.run({ port: options.port, callback: options.callback });
  const address = servers.appServer.address();
  const port = typeof address === 'object' && address ? address.port : options.port;

  let stopping: Promise<boolean> | undefined;
  const matchQueues = () =>
    Array.from((server.transport as unknown as { perMatchQueue?: Map<string, { onIdle(): Promise<void> }> })
      .perMatchQueue?.values() ?? []);
  const stop = (timeoutMs?: number) => {
    // Closing Socket.IO empties the rooms, and boardgame.io then drops their
    // move queues: take them first so queued moves still finish.
    const queuedMoves = matchQueues();
    stopping ??= shutdownGracefully({
      timeoutMs,
      stopAccepting: async () => {
        const io = (server.app as unknown as { _io?: { close(callback?: () => void): void } })._io;
        await new Promise<void>((resolve) => (io ? io.close(() => resolve()) : resolve()));
        server.kill(servers);
        // Let disconnect handlers enqueue their metadata writes.
        await new Promise<void>((resolve) => setImmediate(resolve));
      },
      waitForMoves: async () => {
        await Promise.all([...queuedMoves, ...matchQueues()].map((queue) => queue.onIdle()));
      },
      flushWrites: () => persistence.close(),
    });
    return stopping;
  };

  return { server, persistence, port, stop };
}

/**
 * Fly sends SIGTERM (start-production.sh forwards it to this process) and
 * kills after kill_timeout (5s by default): finish in-flight and pending
 * latest-state writes, then exit (0 when nothing was left unsaved).
 */
export function exitOnSignals(running: RunningGameServer, beforeExit: () => Promise<unknown> = async () => undefined) {
  const shutdown = async () => {
    const clean = await running.stop(4_000);
    await beforeExit().catch(() => undefined);
    process.exit(clean ? 0 : 1);
  };
  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}
