import * as Sentry from "@sentry/node";
import game from "./game";
import { loadWebappEnv } from "./env";
import { startGameServer } from "./server/gameServer";
import { PersistenceConfigError } from "./server/persistence/config";
import { HostTokenConfigError } from "./server/persistence/hostToken";

const sentryDsn = process.env.SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    defaultIntegrations: false,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
  });
}

async function captureStartupError(error: Error) {
  if (sentryDsn) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
  }
}

async function serve() {
  const env = loadWebappEnv();
  const dev = !env.isProduction;

  console.log(`Starting server on port ${env.port} in ${dev ? 'dev' : 'production'} mode...`);

  const running = await startGameServer({
    games: [game],
    port: env.port,
    origins: env.gameServerOrigins,
    callback: () => console.log(`Main server running on port ${env.port}...`),
  });
  console.log(`Match persistence: ${running.persistence.status()}`);

  // Fly sends SIGTERM (start-production.sh forwards it here) and kills after
  // kill_timeout (default 5s): finish in-flight writes, then exit.
  const shutdown = async () => {
    const clean = await running.stop(4_000);
    await Sentry.flush(500).catch(() => false);
    process.exit(clean ? 0 : 1);
  };
  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}

serve().catch(async (error: unknown) => {
  // Config errors carry fixed messages; any other error may contain secrets
  // (for example a connection string), so it is replaced before logging.
  const safe = error instanceof PersistenceConfigError || error instanceof HostTokenConfigError
    ? error
    : new Error('Game server startup failed');
  console.error(safe.message);
  await captureStartupError(safe);
  process.exit(1);
});
