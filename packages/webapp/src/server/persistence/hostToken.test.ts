import { randomBytes } from 'node:crypto';
import { SignJWT, UnsecuredJWT } from 'jose';
import {
  HOST_TOKEN_AUDIENCE,
  HostTokenConfigError,
  currentHostUserId,
  hostIdentityMiddleware,
  readHostTokenSecret,
  verifyHostToken,
} from './hostToken';
import { issueTestHostToken } from './testHostToken';

// Throwaway secret generated per run; never a committed value.
const rawSecret = randomBytes(32).toString('base64url');
const secret = readHostTokenSecret(rawSecret)!;

describe('GAME_SERVER_AUTH_SECRET length (DB-P5)', () => {
  it('measures bytes, not characters', () => {
    expect(() => readHostTokenSecret('a'.repeat(31))).toThrow(HostTokenConfigError);
    expect(readHostTokenSecret('a'.repeat(32))!.byteLength).toBe(32);
    // 16 characters, 31 bytes: too short although the string "looks" long enough in bytes per char.
    expect(() => readHostTokenSecret('é'.repeat(15) + 'a')).toThrow(HostTokenConfigError);
    // 16 characters, 32 bytes: accepted although only 16 characters.
    expect(readHostTokenSecret('é'.repeat(16))!.byteLength).toBe(32);
    // 11 CJK characters, 33 bytes; 10 CJK characters, 30 bytes.
    expect(readHostTokenSecret('密'.repeat(11))!.byteLength).toBe(33);
    expect(() => readHostTokenSecret('密'.repeat(10))).toThrow(HostTokenConfigError);
  });

  it('treats an unset secret as member hosting disabled', () => {
    expect(readHostTokenSecret(undefined)).toBeUndefined();
    expect(readHostTokenSecret('')).toBeUndefined();
  });

  it('never echoes the secret in the error', () => {
    const short = 'short-secret-sentinel';
    try {
      readHostTokenSecret(short);
      throw new Error('expected a config error');
    } catch (error) {
      expect(String((error as Error).message)).not.toContain(short);
    }
  });

  it('refuses to verify with a short key even if the caller skips the check', async () => {
    await expect(verifyHostToken('x', new Uint8Array(31))).rejects.toBeInstanceOf(HostTokenConfigError);
  });
});

describe('host token verification (DB-A1)', () => {
  it('accepts HS256 with sub, exp and the shared audience', async () => {
    const token = await issueTestHostToken(secret, { sub: 'member-1' });
    await expect(verifyHostToken(token, secret)).resolves.toEqual({ userId: 'member-1' });
  });

  it.each([
    ['absent', async () => undefined, 'missing'],
    ['expired', async () => issueTestHostToken(secret, { sub: 'm', expiresInSeconds: -60 }), 'expired'],
    ['tampered', async () => {
      const token = await issueTestHostToken(secret, { sub: 'member-1' });
      const [header, , signature] = token.split('.');
      const forged = Buffer.from(JSON.stringify({ sub: 'admin', aud: HOST_TOKEN_AUDIENCE, exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
      return `${header}.${forged}.${signature}`;
    }, 'invalid'],
    ['signed with another secret', async () => issueTestHostToken(randomBytes(32), { sub: 'm' }), 'invalid'],
    ['wrong algorithm (HS384)', async () => issueTestHostToken(secret, { sub: 'm', alg: 'HS384' }), 'invalid'],
    ['unsigned (alg none)', async () => new UnsecuredJWT({ sub: 'm' }).setAudience(HOST_TOKEN_AUDIENCE).setExpirationTime('2m').encode(), 'invalid'],
    ['missing sub', async () => issueTestHostToken(secret, {}), 'claims'],
    ['missing exp', async () => issueTestHostToken(secret, { sub: 'm', expiresInSeconds: null }), 'claims'],
    ['missing aud', async () => issueTestHostToken(secret, { sub: 'm', aud: null }), 'claims'],
    ['wrong aud', async () => issueTestHostToken(secret, { sub: 'm', aud: 'some-other-service' }), 'claims'],
    ['longer than five minutes', async () => issueTestHostToken(secret, { sub: 'm', expiresInSeconds: 3600 }), 'lifetime'],
    ['garbage', async () => 'not-a-jwt', 'invalid'],
  ])('rejects a token that is %s', async (_name, make, reason) => {
    await expect(verifyHostToken(await make(), secret)).resolves.toEqual({ rejected: reason });
  });

  it('rejects an empty subject', async () => {
    const token = await new SignJWT({ sub: ' ' }).setProtectedHeader({ alg: 'HS256' })
      .setAudience(HOST_TOKEN_AUDIENCE).setExpirationTime('2m').sign(secret);
    await expect(verifyHostToken(token, secret)).resolves.toEqual({ rejected: 'claims' });
  });
});

describe('hostIdentityMiddleware', () => {
  const ctx = (path: string, authorization = '') => ({
    method: 'POST',
    path,
    get: (field: string) => (field.toLowerCase() === 'authorization' ? authorization : ''),
  });

  it('binds each overlapping create to its own verified identity', async () => {
    const middleware = hostIdentityMiddleware(secret);
    const seen: (string | undefined)[] = [];
    const slowNext = (ms: number) => async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      seen.push(currentHostUserId());
    };
    const tokenA = await issueTestHostToken(secret, { sub: 'member-a' });
    const tokenB = await issueTestHostToken(secret, { sub: 'member-b' });
    await Promise.all([
      middleware(ctx('/games/OpenStarTerVillage/create', `Bearer ${tokenA}`), slowNext(20)),
      middleware(ctx('/games/OpenStarTerVillage/create', `Bearer ${tokenB}`), slowNext(5)),
      middleware(ctx('/games/OpenStarTerVillage/create'), slowNext(10)),
    ]);
    expect(seen).toEqual(['member-b', undefined, 'member-a']);
    expect(currentHostUserId()).toBeUndefined();
  });

  it('falls back to a guest host without logging the token', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const token = await issueTestHostToken(secret, { sub: 'member-a', aud: 'wrong' });
    let identity: string | undefined = 'unset';
    await hostIdentityMiddleware(secret)(ctx('/games/OpenStarTerVillage/create', `Bearer ${token}`), async () => {
      identity = currentHostUserId();
    });
    expect(identity).toBeUndefined();
    const logged = JSON.stringify(warn.mock.calls);
    expect(logged).not.toContain(token);
    expect(logged).not.toContain(rawSecret);
    warn.mockRestore();
  });

  it('ignores other routes and verifies nothing without a secret', async () => {
    const token = await issueTestHostToken(secret, { sub: 'member-a' });
    let identity: string | undefined = 'unset';
    await hostIdentityMiddleware(undefined)(ctx('/games/OpenStarTerVillage/create', `Bearer ${token}`), async () => {
      identity = currentHostUserId();
    });
    expect(identity).toBeUndefined();
    identity = 'unset';
    await hostIdentityMiddleware(secret)(ctx('/games/OpenStarTerVillage/abc/leave', `Bearer ${token}`), async () => {
      identity = currentHostUserId();
    });
    expect(identity).toBeUndefined();
  });
});
