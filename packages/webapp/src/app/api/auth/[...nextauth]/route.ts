import type { NextRequest } from 'next/server';
import { currentMember, handlers } from '@/server/members/auth';
import { memberFeaturesEnabled } from '@/server/members/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: NextRequest): Promise<Response> {
  if (!memberFeaturesEnabled() || !process.env.AUTH_SECRET) return new Response(null, { status: 503 });
  try {
    // Auth.js otherwise links a new OAuth account to the currently signed-in user.
    if (request.nextUrl.pathname.startsWith('/api/auth/callback/') && await currentMember()) {
      return new Response(null, { status: 409 });
    }
    return await (request.method === 'GET' ? handlers.GET(request) : handlers.POST(request));
  } catch {
    return new Response(null, { status: 503 });
  }
}

export { handle as GET, handle as POST };
