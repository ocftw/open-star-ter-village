import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SECURE_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/server/members/auth';
import { memberDatabase, memberFeaturesEnabled } from '@/server/members/database';
import { isTestLoginEnabled } from '@/server/members/providers';

export const runtime = 'nodejs';

export function GET() {
  return new Response(null, { status: 404 });
}

export async function POST(request: NextRequest) {
  if (!isTestLoginEnabled()) return new Response(null, { status: 404 });
  if (!memberFeaturesEnabled() || !process.env.AUTH_SECRET) return new Response(null, { status: 503 });
  const origin = new URL(process.env.AUTH_URL ?? request.nextUrl.origin);
  if (request.headers.get('origin') !== origin.origin) return new Response(null, { status: 403 });

  const token = randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  try {
    const db = await memberDatabase();
    await db.query(
      `with member as (insert into users default values returning id)
       insert into sessions ("userId", "sessionToken", expires) select id, $1, $2 from member`,
      [token, expires],
    );
  } catch {
    return new Response(null, { status: 503 });
  }

  const response = NextResponse.redirect(new URL('/onboarding', origin), 303);
  // Match the Auth.js database-session cookie for the request protocol.
  const secure = origin.protocol === 'https:';
  response.cookies.set(secure ? SECURE_SESSION_COOKIE_NAME : SESSION_COOKIE_NAME, token, {
    expires, httpOnly: true, sameSite: 'lax', path: '/', secure,
  });
  return response;
}
