import { Server, Origins } from "boardgame.io/server";
import * as Sentry from "@sentry/node";
import packageJson from "../package.json";
import game from "./game";
import { loadWebappEnv } from "./env";
import { createKeyedTaskQueue } from "./keyedTaskQueue";

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

async function serve() {
  const env = loadWebappEnv();
  const dev = !env.isProduction;

  console.log(`Starting server on port ${env.port} in ${dev ? 'dev' : 'production'} mode...`);

  const server = Server({
    games: [game],
    origins: [
      ...env.gameServerOrigins,
      // Allow localhost to connect, except when NODE_ENV is 'production'.
      Origins.LOCALHOST_IN_DEVELOPMENT,
    ],
  });

  // boardgame.io's playAgain endpoint reads metadata.nextMatchID, then
  // asynchronously creates the next match before writing the id back — two
  // concurrent 再玩一次 clicks can both pass that check and split the table
  // across separate rematch rooms. Serializing the route per ORIGINAL match
  // ID closes the window so the upstream dedupe reliably returns one room.
  // Registered before server.run(), which is when boardgame.io attaches its
  // API router, so this middleware always runs first. In-process only —
  // matches the single-machine game server.
  const PLAY_AGAIN_PATH = /^\/games\/[^/]+\/([^/]+)\/playAgain\/?$/;
  const rematchQueue = createKeyedTaskQueue();
  server.app.use(async (ctx, next) => {
    const match = ctx.method === 'POST' ? PLAY_AGAIN_PATH.exec(ctx.path) : null;
    if (!match) {
      return next();
    }
    await rematchQueue.runExclusive(decodeURIComponent(match[1]), next);
  });

  server.router.get('/health', (ctx) => {
    ctx.status = 200;
    ctx.body = {
      status: 'ok',
      uptime: process.uptime(),
      version: packageVersion,
      gameName,
    };
  });

  const config = {
    port: env.port,
    callback: () => console.log(`Main server running on port ${env.port}...`),
  };

  server.run(config);
}

serve().catch(async (error) => {
  console.error(error);
  await captureStartupError(error);
  process.exit(1);
});
