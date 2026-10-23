import { SignJWT } from 'jose';
import type { Server } from 'boardgame.io';
import { hostIdentity, hostIdentityMiddleware } from './hostIdentity';

const secret = 'test-only-secret-not-used-outside-this-test';
const key = new TextEncoder().encode(secret);

async function token(options: { secret?: string; alg?: string; exp?: number; sub?: string } = {}) {
  return new SignJWT({})
    .setProtectedHeader({ alg: options.alg ?? 'HS256' })
    .setSubject(options.sub ?? 'member-1')
    .setExpirationTime(options.exp ?? Math.floor(Date.now() / 1000) + 300)
    .sign(options.secret ? new TextEncoder().encode(options.secret) : key);
}

function context(authorization?: string) {
  return {
    method: 'POST', path: '/games/OpenStarTerVillage/create',
    get: (name: string) => name === 'authorization' ? authorization ?? '' : '',
    request: { body: { hostUserId: 'forged-member' } },
  } as unknown as Server.AppCtx;
}

describe('host identity middleware', () => {
  let warning: jest.SpyInstance;
  beforeEach(() => { warning = jest.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { warning.mockRestore(); });

  it('exposes a verified identity only inside its request', async () => {
    let identity: string | undefined;
    await hostIdentityMiddleware(secret)(context(`Bearer ${await token()}`), async () => {
      identity = hostIdentity.getStore();
    });
    expect(identity).toBe('member-1');
    expect(hostIdentity.getStore()).toBeUndefined();
    expect(warning).not.toHaveBeenCalled();
  });

  it.each(['missing', 'expired', 'wrong-key', 'wrong-algorithm', 'empty-subject', 'no-secret'])
  ('treats %s as a guest, ignores a forged body identity, and logs no token', async kind => {
    const value = kind === 'missing' ? undefined : await token({
      secret: kind === 'wrong-key' ? 'wrong-key-that-is-only-used-for-tests' : undefined,
      alg: kind === 'wrong-algorithm' ? 'HS384' : undefined,
      exp: kind === 'expired' ? Math.floor(Date.now() / 1000) - 1 : undefined,
      sub: kind === 'empty-subject' ? '' : undefined,
    });
    const ctx = context(value ? `Bearer ${value}` : undefined);
    await hostIdentityMiddleware(kind === 'no-secret' ? undefined : secret)(ctx, async () => {
      expect(hostIdentity.getStore()).toBeUndefined();
      ctx.status = 200;
    });
    expect(ctx.status).toBe(200);
    expect(warning).toHaveBeenCalledWith('Match created without a verified member host');
    expect(JSON.stringify(warning.mock.calls)).not.toContain(secret);
    if (value) expect(JSON.stringify(warning.mock.calls)).not.toContain(value);
  });

  it.each(['sub', 'exp'])('requires the %s claim', async missing => {
    const jwt = await new SignJWT(missing === 'sub' ? { exp: Math.floor(Date.now() / 1000) + 300 } : { sub: 'member' })
      .setProtectedHeader({ alg: 'HS256' }).sign(key);
    await hostIdentityMiddleware(secret)(context(`Bearer ${jwt}`), async () => {
      expect(hostIdentity.getStore()).toBeUndefined();
    });
  });

  it('does not mix identities across overlapping create requests', async () => {
    const middleware = hostIdentityMiddleware(secret);
    const identities: string[] = [];
    await Promise.all(['first', 'second'].map(async sub => {
      await middleware(context(`Bearer ${await token({ sub })}`), async () => {
        await new Promise(resolve => setTimeout(resolve, sub === 'first' ? 10 : 1));
        identities.push(hostIdentity.getStore()!);
        expect(hostIdentity.getStore()).toBe(sub);
      });
    }));
    expect(identities.sort()).toEqual(['first', 'second']);
  });

  it('leaves other routes alone and propagates downstream errors', async () => {
    const ctx = context();
    ctx.path = '/games/OpenStarTerVillage/match/join';
    const next = jest.fn(async () => {});
    await hostIdentityMiddleware(secret)(ctx, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(warning).not.toHaveBeenCalled();
    await expect(hostIdentityMiddleware(secret)(context(), async () => {
      throw new Error('route error');
    })).rejects.toThrow('route error');
  });
});
