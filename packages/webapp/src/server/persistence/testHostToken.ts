import { SignJWT } from 'jose';
import { HOST_TOKEN_ALGORITHM, HOST_TOKEN_AUDIENCE } from './hostToken';

/**
 * Test-only issuer. Product code issues no host tokens yet (#452); tests use
 * this with throwaway secrets generated at runtime.
 */
export async function issueTestHostToken(
  secret: Uint8Array,
  claims: { sub?: string; aud?: string | null; expiresInSeconds?: number | null; alg?: 'HS256' | 'HS384' } = {},
): Promise<string> {
  const jwt = new SignJWT({}).setProtectedHeader({ alg: claims.alg ?? HOST_TOKEN_ALGORITHM }).setIssuedAt();
  if (claims.sub !== undefined) jwt.setSubject(claims.sub);
  if (claims.aud !== null) jwt.setAudience(claims.aud ?? HOST_TOKEN_AUDIENCE);
  if (claims.expiresInSeconds !== null) {
    jwt.setExpirationTime(Math.floor(Date.now() / 1000) + (claims.expiresInSeconds ?? 120));
  }
  return jwt.sign(secret);
}
