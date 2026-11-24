import { redirect } from 'next/navigation';
import { AppHeader, PaperCard, StickerButton } from '@/components/design';
import { isValidPlayerName } from '@/lib/playerName';
import { currentMember, signOut } from '@/server/members/auth';
import { memberDatabase, memberFeaturesEnabled } from '@/server/members/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONSENT_VERSION = '2026-11-ocf-contact-v1';

export default async function Onboarding({ searchParams }: { searchParams: { error?: string } }) {
  if (!memberFeaturesEnabled()) redirect('/lobby');
  const member = await currentMember().catch(() => undefined);
  if (!member) redirect('/sign-in');
  if (member.nickname) redirect('/lobby');

  async function completeOnboarding(formData: FormData) {
    'use server';
    const member = await currentMember().catch(() => undefined);
    if (!member || member.nickname) redirect('/lobby');
    const nickname = formData.get('nickname');
    if (typeof nickname !== 'string' || !isValidPlayerName(nickname)) redirect('/onboarding?error=nickname');

    try {
      const db = await memberDatabase();
      await db.query(
        `update users set nickname = $1, marketing_opt_in = $2, consent_version = $3, opt_in_at = now()
         where id = $4 and nickname is null`,
        [nickname.trim(), formData.get('contactOptIn') === 'on', CONSENT_VERSION, member.id],
      );
    } catch {
      redirect('/onboarding?error=save');
    }
    redirect('/lobby');
  }

  async function leaveMemberSession() {
    'use server';
    if (memberFeaturesEnabled() && process.env.AUTH_SECRET) await signOut({ redirectTo: '/lobby' });
  }

  const nicknameError = searchParams.error === 'nickname';

  return (
    <main>
      <AppHeader />
      <PaperCard className="member-card" padding={28}>
        <h1>設定暱稱 <span className="en-cap">Choose a nickname</span></h1>
        <form action={completeOnboarding} className="member-card-actions">
          <label className="member-nickname-field">
            <span>暱稱 · Nickname</span>
            <input
              name="nickname"
              required
              maxLength={20}
              autoComplete="nickname"
              aria-invalid={nicknameError || undefined}
              aria-describedby={nicknameError ? 'nickname-help nickname-error' : 'nickname-help'}
            />
            <small id="nickname-help">1 到 20 個字 · Use 1 to 20 characters.</small>
            {nicknameError && (
              <p id="nickname-error" className="member-error" role="alert">
                ⚠ 請輸入 1 到 20 個字 · Enter 1 to 20 characters.
              </p>
            )}
          </label>
          <label className="member-opt-in">
            <input name="contactOptIn" type="checkbox" defaultChecked={process.env.CONTACT_OPT_IN_DEFAULT === 'true'} />
            <span>寄送 OCF 最新消息與教學素材給我<br />Send me OCF news and teaching materials</span>
          </label>
          {searchParams.error === 'save' && <p className="member-error" role="alert">儲存失敗，請再試一次。 Could not save. Try again.</p>}
          <StickerButton type="submit">儲存並繼續 · Save and continue</StickerButton>
        </form>
        <form action={leaveMemberSession}>
          <StickerButton type="submit" variant="ghost" size="sm">登出 · Sign out</StickerButton>
        </form>
      </PaperCard>
    </main>
  );
}
