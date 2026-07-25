export const DEV_PERSPECTIVES = ['player1', 'player2', 'player3', 'observer'] as const;
export const DEV_TRANSPORTS = ['offline', 'online'] as const;

export type DevPerspective = (typeof DEV_PERSPECTIVES)[number];
export type DevTransport = (typeof DEV_TRANSPORTS)[number];
export type SearchParamValue = string | string[] | undefined;

export interface DevConfig {
  perspective: DevPerspective;
  transport: DevTransport;
}

export type DevConfigResult =
  | { ok: true; config: DevConfig }
  | { ok: false; error: string };

function getFirstValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isDevPerspective(value: string): value is DevPerspective {
  return DEV_PERSPECTIVES.some((perspective) => perspective === value);
}

function isDevTransport(value: string): value is DevTransport {
  return DEV_TRANSPORTS.some((transport) => transport === value);
}

export function parseDevConfig({
  user,
  mode,
}: {
  user?: SearchParamValue;
  mode?: SearchParamValue;
}): DevConfigResult {
  const perspective = getFirstValue(user) ?? 'player1';
  const transport = getFirstValue(mode) ?? 'offline';
  const errors: string[] = [];
  let parsedPerspective: DevPerspective | undefined;
  let parsedTransport: DevTransport | undefined;

  if (!isDevPerspective(perspective)) {
    errors.push(`Invalid user "${perspective}". Expected ${DEV_PERSPECTIVES.join(', ')}.`);
  } else {
    parsedPerspective = perspective;
  }

  if (!isDevTransport(transport)) {
    errors.push(`Invalid mode "${transport}". Expected ${DEV_TRANSPORTS.join(' or ')}.`);
  } else {
    parsedTransport = transport;
  }

  if (!parsedPerspective || !parsedTransport) {
    return { ok: false, error: errors.join(' ') };
  }

  return {
    ok: true,
    config: {
      perspective: parsedPerspective,
      transport: parsedTransport,
    },
  };
}

export function getPlayerID(perspective: DevPerspective): string | undefined {
  if (perspective === 'observer') {
    return undefined;
  }

  return String(DEV_PERSPECTIVES.indexOf(perspective));
}
