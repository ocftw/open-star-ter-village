import * as Sentry from "@sentry/node";
import game from "./game";
import { loadWebappEnv } from "./env";
import { exitOnSignals, startGameServer } from "./server/gameServer";
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

// Errors whose messages are fixed configuration text, safe to print as-is.
const configErrors = new WeakSet<object>();

async function serve() {
  let env: ReturnType<typeof loadWebappEnv>;
  try {
    env = loadWebappEnv();
  } catch (error) {
    if (error instanceof Error) configErrors.add(error);
    throw error;
  }
  const dev = !env.isProduction;

  console.log(`Starting server on port ${env.port} in ${dev ? 'dev' : 'production'} mode...`);

  const running = await startGameServer({
    games: [game],
    port: env.port,
    origins: env.gameServerOrigins,
    callback: () => console.log(`Main server running on port ${env.port}...`),
  });
  console.log(`Match persistence: ${running.persistence.status()}`);

  exitOnSignals(running, () => Sentry.flush(500));
}

serve().catch(async (error: unknown) => {
  // Config errors carry fixed messages; any other error may contain secrets
  // (for example a connection string), so it is replaced before logging.
  const safe = error instanceof PersistenceConfigError || error instanceof HostTokenConfigError ||
    (error instanceof Error && configErrors.has(error))
    ? error
    : new Error('Game server startup failed');
  console.error(safe.message);
  await captureStartupError(safe);
  process.exit(1);
});
