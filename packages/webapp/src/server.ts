import type { Game } from 'boardgame.io';
import { Server, Origins } from "boardgame.io/server";
import * as Sentry from "@sentry/node";
import packageJson from "../package.json";
import game from "./game";
import { loadWebappEnv } from "./env";
import { hostIdentityMiddleware } from "./server/persistence/hostIdentity";
import { initializePersistence } from "./server/persistence";
import { PersistenceConfigError } from "./server/persistence/config";
import { PersistentStore } from "./server/persistence/PersistentStore";
import { drainOnShutdown } from "./server/persistence/shutdown";

const packageVersion = packageJson.version;
const gameName = 'OpenStarTerVillage';
const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    defaultIntegrations: false,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
  });
}

async function captureStartupError(error: unknown) {
  if (sentryDsn) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
  }
}

export async function serve(games: Game[] = [game]) {
  const env = loadWebappEnv();
  const dev = !env.isProduction;

  console.log(`Starting server on port ${env.port} in ${dev ? 'dev' : 'production'} mode...`);

  const persistence = await initializePersistence();
  const server = Server({
    db: persistence.store,
    games,
    origins: [
      ...env.gameServerOrigins,
      // Allow localhost to connect, except when NODE_ENV is 'production'.
      Origins.LOCALHOST_IN_DEVELOPMENT,
    ],
  });

  server.app.use(hostIdentityMiddleware(process.env.GAME_SERVER_AUTH_SECRET));

  // boardgame.io's playAgain read-check-create-write is not atomic. Serialize
  // these rare requests so concurrent players receive the same next match.
  const PLAY_AGAIN_PATH = /^\/games\/[^/]+\/[^/]+\/playAgain\/?$/;
  let rematchTail = Promise.resolve();
  server.app.use(async (ctx, next) => {
    if (ctx.method !== 'POST' || !PLAY_AGAIN_PATH.test(ctx.path)) {
      return next();
    }

    const run = rematchTail.then(() => next());
    rematchTail = run.then(
      () => undefined,
      () => undefined,
    );
    await run;
  });

  server.router.get('/health', (ctx) => {
    ctx.status = 200;
    ctx.body = {
      status: 'ok',
      persistence: persistence.status,
      uptime: process.uptime(),
      version: packageVersion,
      gameName,
    };
  });

  const config = {
    port: env.port,
    callback: () => console.log(`Main server running on port ${env.port}...`),
  };

  const servers = await server.run(config);
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    const saved = persistence.store instanceof PersistentStore ? persistence.store : undefined;
    const drained = await drainOnShutdown(async () => {
      // Closing Socket.IO disconnects existing clients as well as new intake.
      // A setImmediate turn lets disconnect metadata writes finish before flush.
      const io = (server.app as typeof server.app & { _io: { close: (callback: () => void) => void } })._io;
      await new Promise<void>(resolve => io.close(resolve));
      server.kill(servers);
      await new Promise<void>(resolve => setImmediate(resolve));
      await Promise.all(persistence.store.listMatches().map(id => server.transport.getMatchQueue(id).onIdle()));
    }, saved);
    if (drained) {
      await Promise.race([persistence.close(), new Promise(resolve => setTimeout(resolve, 2000))]);
    }
    await Sentry.flush(2000).catch(() => false);
    process.exit(drained ? 0 : 1);
  };
  process.on('SIGTERM', () => { void shutdown(); });
  process.on('SIGINT', () => { void shutdown(); });
  return { server, servers, persistence };
}

if (require.main === module) void serve().catch(async (error: unknown) => {
  // Only these fixed config messages are safe; other errors can contain secrets.
  const reported = error instanceof PersistenceConfigError ? error : new Error('Game server startup failed');
  console.error(error instanceof PersistenceConfigError ? `Game server startup failed: ${reported.message}` : reported.message);
  await captureStartupError(reported);
  process.exit(1);
});
