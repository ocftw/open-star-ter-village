import NextAuth, { type Session } from 'next-auth';
import PostgresAdapter from '@auth/pg-adapter';
import type { Pool } from 'pg';
import { memberDatabase, memberFeaturesEnabled } from './database';
import { memberProviders } from './providers';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function memberAdapter(db: Pool): ReturnType<typeof PostgresAdapter> {
  const adapter = PostgresAdapter(db);
  return {
    ...adapter,
    async createUser(user) {
      const contactEmail = 'contactEmail' in user && typeof user.contactEmail === 'string' ? user.contactEmail : null;
      const { rows } = await db.query(
        `insert into users (contact_email) values ($1) returning id, name, email, "emailVerified", image`,
        [contactEmail],
      );
      return rows[0];
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const db = await memberDatabase();
  return {
    adapter: memberAdapter(db),
    providers: memberProviders(),
    session: { strategy: 'database', maxAge: SESSION_MAX_AGE_SECONDS },
    pages: { signIn: '/sign-in', error: '/sign-in' },
    callbacks: {
      session({ session, user }) {
        const nickname = 'nickname' in user && typeof user.nickname === 'string' ? user.nickname : null;
        return { expires: session.expires, user: { id: user.id, nickname } };
      },
    },
    events: {
      async signIn({ user }) {
        await db.query('update users set last_seen_at = now() where id = $1', [user.id]);
      },
    },
    logger: {
      error: (error) => console.error('Member authentication failed', { type: error.name }),
      warn: () => console.warn('Member authentication configuration warning'),
      debug: () => {},
    },
  };
});

declare module 'next-auth' {
  interface Session {
    user: { id: string; nickname: string | null };
  }
}

export async function currentMember(): Promise<Session['user'] | undefined> {
  if (!memberFeaturesEnabled() || !process.env.AUTH_SECRET) return undefined;
  return (await auth())?.user;
}
