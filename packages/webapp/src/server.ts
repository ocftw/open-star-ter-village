import { Server, Origins } from "boardgame.io/server";
import * as Sentry from "@sentry/node";
import packageJson from "../package.json";
import game from "./game";
import { loadWebappEnv } from "./env";
import { DEBUG_TELEMETRY_PATH, debugTelemetryHandler } from "./debugTelemetry";
import { ADD_BOT_PATH, REMOVE_BOT_PATH, addBotHandler, removeBotHandler } from "./botSeats";
import { socketPresence, startBotRunner } from "./botRunner";
import { registerLobbyUpdates } from "./server/lobbyUpdates";
import type { GameState } from './game/store/store';

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

  // Persist normalized defaults as well as explicitly selected options, so
  // metadata, waiting rooms and rematches agree with authoritative setup.
  const createMatch = server.db.createMatch.bind(server.db);
  server.db.createMatch = (id, options) => {
    const standard = (options.initialState.G as GameState).standard;
    if (!standard) return createMatch(id, options);
    return createMatch(id, { ...options, metadata: { ...options.metadata, setupData: {
      ...options.metadata.setupData,
      ruleset: standard.version, experiments: standard.experiments, standardOptions: standard.options,
    } } });
  };
  registerLobbyUpdates(server);

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
      uptime: process.uptime(),
      version: packageVersion,
      gameName,
    };
  });

  if (env.debugTelemetry) {
    console.warn(`DEBUG_TELEMETRY is on: ${DEBUG_TELEMETRY_PATH} exposes balance telemetry. Use it only on test deployments, never on the live game server.`);
    server.router.get(DEBUG_TELEMETRY_PATH, debugTelemetryHandler(server.db));
  }

  // Host-only bot seats; the bot runner below plays them once the game starts.
  server.router.post(ADD_BOT_PATH, addBotHandler(server.db, gameName));
  server.router.post(REMOVE_BOT_PATH, removeBotHandler(server.db, gameName));

  const config = {
    port: env.port,
    callback: () => {
      console.log(`Main server running on port ${env.port}...`);
      startBotRunner({
        db: server.db,
        game,
        serverURL: `http://localhost:${env.port}`,
        moveDelayMs: env.botMoveDelayMs,
        isPlayerConnected: socketPresence(server.transport),
      });
    },
  };

  server.run(config);
}

serve().catch(async (error) => {
  console.error(error);
  await captureStartupError(error);
  process.exit(1);
});
