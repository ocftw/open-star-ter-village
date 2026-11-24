import { SignJWT } from 'jose';
import { currentMember } from '@/server/members/auth';
import { memberFeaturesEnabled } from '@/server/members/database';
import {
  HOST_TOKEN_ALGORITHM, HOST_TOKEN_AUDIENCE, HOST_TOKEN_MAX_LIFETIME_SECONDS, readHostTokenSecret,
} from '@/server/persistence/hostToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };
const TOKEN_LIMIT = 10;
const attempts = new Map<string, number>();
let currentMinute = -1;

export async function GET(): Promise<Response> {
  try {
    if (!memberFeaturesEnabled()) return new Response(null, { status: 503, headers });
    const secret = readHostTokenSecret(process.env.GAME_SERVER_AUTH_SECRET);
    if (!secret) return new Response(null, { status: 503, headers });
    const member = await currentMember();
    if (!member?.nickname) return new Response(null, { status: 401, headers });

    const now = Math.floor(Date.now() / 1000);
    const minute = Math.floor(now / 60);
    if (minute !== currentMinute) {
      currentMinute = minute;
      attempts.clear();
    }
    const count = attempts.get(member.id) ?? 0;
    if (count >= TOKEN_LIMIT) {
      return new Response(null, { status: 429, headers: { ...headers, 'Retry-After': String(60 - now % 60) } });
    }
    attempts.set(member.id, count + 1);

    const expiresAt = now + HOST_TOKEN_MAX_LIFETIME_SECONDS;
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: HOST_TOKEN_ALGORITHM })
      .setSubject(member.id)
      .setAudience(HOST_TOKEN_AUDIENCE)
      .setExpirationTime(expiresAt)
      .sign(secret);
    return Response.json({ token, expiresAt }, { headers });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
