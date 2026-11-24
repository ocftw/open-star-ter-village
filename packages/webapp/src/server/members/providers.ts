import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export function isTestLoginEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.AUTH_TEST_LOGIN === '1';
}

function privateProfile(id: string, contactEmail?: string | null) {
  return { id, name: null, email: null, image: null, contactEmail: contactEmail ?? null };
}

export function memberProviders(env = process.env): NextAuthConfig['providers'] {
  const providers: NextAuthConfig['providers'] = [];
  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    providers.push(Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      profile: ({ sub, email, email_verified }) => privateProfile(sub, email_verified ? email : null),
      account: () => ({}),
    }));
  }
  if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
    providers.push(GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
      profile: ({ id, email }) => privateProfile(String(id), email),
      account: () => ({}),
    }));
  }
  return providers;
}
