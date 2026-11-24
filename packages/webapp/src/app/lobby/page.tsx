import { redirect } from 'next/navigation';
import { currentMember, signOut } from '@/server/members/auth';
import { memberFeaturesEnabled } from '@/server/members/database';
import { memberSignInOptions } from '@/server/members/providers';
import Lobby from './Lobby';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function LobbyPage() {
  const member = await currentMember().catch(() => undefined);
  if (member && !member.nickname) redirect('/onboarding');
  const { providers, showTestLogin } = memberSignInOptions();
  const memberAvailable = Boolean(member?.nickname) || providers.length > 0 || showTestLogin;

  async function leaveMemberSession() {
    'use server';
    if (memberFeaturesEnabled() && process.env.AUTH_SECRET) await signOut({ redirectTo: '/lobby' });
  }

  return <Lobby memberAvailable={memberAvailable} nickname={member?.nickname ?? undefined} signOut={leaveMemberSession} />;
}
