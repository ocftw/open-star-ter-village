import { redirect } from 'next/navigation';
import { currentMember, signOut } from '@/server/members/auth';
import { memberFeaturesEnabled } from '@/server/members/database';
import Lobby from './Lobby';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function LobbyPage() {
  const enabled = memberFeaturesEnabled();
  const member = enabled ? await currentMember().catch(() => undefined) : undefined;
  if (member && !member.nickname) redirect('/onboarding');

  async function leaveMemberSession() {
    'use server';
    if (memberFeaturesEnabled() && process.env.AUTH_SECRET) await signOut({ redirectTo: '/lobby' });
  }

  return <Lobby memberAvailable={enabled} nickname={member?.nickname ?? undefined} signOut={leaveMemberSession} />;
}
