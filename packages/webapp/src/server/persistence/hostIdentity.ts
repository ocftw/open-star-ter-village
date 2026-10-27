import { AsyncLocalStorage } from 'node:async_hooks';
import { jwtVerify } from 'jose';
import type { Server } from 'boardgame.io';

// Identity belongs to the request, not a mutable global: overlapping create
// requests must never borrow another host's identity.
export const hostIdentity = new AsyncLocalStorage<string | undefined>();

export function hostIdentityMiddleware(secret: string | undefined) {
  return async (ctx: Server.AppCtx, next: () => Promise<unknown>) => {
    if (ctx.method !== 'POST' || !/^\/games\/[^/]+\/create\/?$/.test(ctx.path)) {
      return next();
    }
    let userID: string | undefined;
    const authorization = ctx.get('authorization');
    const token = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1];
    if (token && secret) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
          algorithms: ['HS256'],
          requiredClaims: ['sub', 'exp'],
        });
        if (typeof payload.sub === 'string' && payload.sub.trim()) userID = payload.sub;
      } catch {
        // Verification errors may contain token data. Never log or report them.
      }
    }
    if (!userID) console.warn('Match created without a verified member host');
    // Never read hostUserId from the body, setupData, or player data.
    return hostIdentity.run(userID, next);
  };
}
