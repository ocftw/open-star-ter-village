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
  const { authEnabled, providers, showTestLogin } = memberSignInOptions();
  const memberAvailable = Boolean(member?.nickname) || providers.length > 0 || showTestLogin;
  // Same wording as /sign-in: off/unconfigured persistence is "temporarily unavailable";
  // persistence on but no sign-in provider yet is "coming soon".
  const memberNotice = authEnabled ? 'coming-soon' : 'unavailable';

  async function leaveMemberSession() {
    'use server';
    if (memberFeaturesEnabled() && process.env.AUTH_SECRET) await signOut({ redirectTo: '/lobby' });
  }

  return <Lobby memberAvailable={memberAvailable} memberNotice={memberNotice} nickname={member?.nickname ?? undefined} signOut={leaveMemberSession} />;
}
