import { AsyncLocalStorage } from 'node:async_hooks';
import { errors, jwtVerify } from 'jose';

/**
 * Audience shared by the (future, #452) token issuer and this verifier. A host
 * token without exactly this `aud` is invalid.
 */
export const HOST_TOKEN_AUDIENCE = 'open-star-ter-village:game-server';
export const HOST_TOKEN_ALGORITHM = 'HS256';
/** Host tokens are short-lived by contract (#447): `exp` at most five minutes ahead. */
export const HOST_TOKEN_MAX_LIFETIME_SECONDS = 5 * 60;
export const MIN_SECRET_BYTES = 32;
const CLOCK_TOLERANCE_SECONDS = 5;

/** Fixed-message configuration error; never includes the secret. */
export class HostTokenConfigError extends Error {
  name = 'HostTokenConfigError';
}

/**
 * Validate GAME_SERVER_AUTH_SECRET. Unset disables member hosting (every create
 * is guest-hosted). Set but shorter than 32 bytes (UTF-8 bytes, not characters)
 * fails closed: it throws instead of verifying with a weak key.
 */
export function readHostTokenSecret(raw: string | undefined): Uint8Array | undefined {
  if (raw === undefined || raw === '') return undefined;
  const bytes = new TextEncoder().encode(raw);
  if (bytes.byteLength < MIN_SECRET_BYTES) {
    throw new HostTokenConfigError(`GAME_SERVER_AUTH_SECRET must be at least ${MIN_SECRET_BYTES} bytes`);
  }
  return bytes;
}

export type HostTokenRejection = 'missing' | 'invalid' | 'expired' | 'lifetime' | 'claims';

export type HostTokenResult = { userId: string } | { rejected: HostTokenRejection };

/** Verify a host token. Errors are mapped to fixed codes; token data never escapes. */
export async function verifyHostToken(token: string | undefined, secret: Uint8Array): Promise<HostTokenResult> {
  if (secret.byteLength < MIN_SECRET_BYTES) {
    // Defence in depth for callers that bypass readHostTokenSecret.
    throw new HostTokenConfigError(`GAME_SERVER_AUTH_SECRET must be at least ${MIN_SECRET_BYTES} bytes`);
  }
  if (!token) return { rejected: 'missing' };
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [HOST_TOKEN_ALGORITHM],
      audience: HOST_TOKEN_AUDIENCE,
      requiredClaims: ['sub', 'exp', 'aud'],
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
    });
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp > now + HOST_TOKEN_MAX_LIFETIME_SECONDS + CLOCK_TOLERANCE_SECONDS) {
      return { rejected: 'lifetime' };
    }
    if (typeof payload.sub !== 'string' || payload.sub.trim() === '') return { rejected: 'claims' };
    return { userId: payload.sub };
  } catch (error) {
    if (error instanceof errors.JWTExpired) return { rejected: 'expired' };
    if (error instanceof errors.JWTClaimValidationFailed) return { rejected: 'claims' };
    return { rejected: 'invalid' };
  }
}

/** Verified member identity of the current request; undefined for guests. */
export const hostIdentity = new AsyncLocalStorage<{ userId?: string }>();

export function currentHostUserId(): string | undefined {
  return hostIdentity.getStore()?.userId;
}

const CREATE_PATH = /^\/games\/[^/]+\/create\/?$/;
const JOIN_PATH = /^\/games\/[^/]+\/[^/]+\/join\/?$/;
const PLAY_AGAIN_PATH = /^\/games\/[^/]+\/[^/]+\/playAgain\/?$/;

interface IdentityCtx {
  method: string;
  path: string;
  get(field: string): string;
}

/**
 * Koa middleware for the lobby routes that can create or take over a match
 * host (create, join, playAgain). It reads only `Authorization: Bearer`, never
 * the request body, and binds the verified subject to this request alone, so
 * overlapping creates cannot borrow each other's identity. A missing or
 * invalid token falls back to a guest host (HTTP status unchanged).
 */
export function hostIdentityMiddleware(secret: Uint8Array | undefined) {
  return async (ctx: IdentityCtx, next: () => Promise<unknown>) => {
    const isCreate = CREATE_PATH.test(ctx.path);
    if (ctx.method !== 'POST' || !(isCreate || JOIN_PATH.test(ctx.path) || PLAY_AGAIN_PATH.test(ctx.path))) {
      return next();
    }
    const token = /^Bearer ([^\s]+)$/i.exec(ctx.get('authorization') ?? '')?.[1];
    let userId: string | undefined;
    if (secret && token) {
      const result = await verifyHostToken(token, secret);
      if ('userId' in result) userId = result.userId;
      else console.warn('Host token rejected; continuing as guest host', { reason: result.rejected });
    }
    if (isCreate && !userId) console.warn('Match created without a verified member host');
    return hostIdentity.run({ userId }, next);
  };
}
