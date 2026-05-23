import { Server, Origins } from "boardgame.io/server";
import * as Sentry from "@sentry/node";
import packageJson from "../package.json";
import game from "./game";
import { loadWebappEnv } from "./env";

const packageVersion = packageJson.version;
const gameName = 'OpenStarTerVillage';
const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0.1,
  });
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

  if (sentryDsn) {
    Sentry.setupKoaErrorHandler(server.app);
  }

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

serve();
