export interface WebappEnv {
  gameServerOrigins: string[];
  isProduction: boolean;
  port: number;
}

const DEFAULT_GAME_SERVER_PORT = 3001;

function reportConfigIssue(message: string, isProduction: boolean): void {
  if (isProduction) {
    throw new Error(message);
  }

  console.warn(message);
}

function parsePort(value: string | undefined, isProduction: boolean): number {
  if (!value) return DEFAULT_GAME_SERVER_PORT;

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    reportConfigIssue(`PORT must be an integer from 1 to 65535; received "${value}".`, isProduction);
    return DEFAULT_GAME_SERVER_PORT;
  }

  return port;
}

function parseGameServerOrigins(value: string | undefined, isProduction: boolean): string[] {
  const origins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  if (origins.length === 0) {
    reportConfigIssue(
      'GAME_SERVER_ORIGINS is not set. Set it to a comma-separated list of allowed client origins.',
      isProduction
    );
  }

  return origins;
}

export function loadWebappEnv(env: NodeJS.ProcessEnv = process.env): WebappEnv {
  const isProduction = env.NODE_ENV === 'production';

  if (!env.NEXT_PUBLIC_GAME_SERVER_URL) {
    reportConfigIssue(
      'NEXT_PUBLIC_GAME_SERVER_URL is not set. Next.js inlines this value at build time.',
      isProduction
    );
  }

  return {
    gameServerOrigins: parseGameServerOrigins(env.GAME_SERVER_ORIGINS, isProduction),
    isProduction,
    port: parsePort(env.PORT, isProduction),
  };
}
