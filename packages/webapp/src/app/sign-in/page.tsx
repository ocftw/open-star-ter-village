import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppHeader, PaperCard, StickerButton } from '@/components/design';
import { currentMember, signIn } from '@/server/members/auth';
import { memberFeaturesEnabled } from '@/server/members/database';
import { memberSignInOptions } from '@/server/members/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function SignInPage({ searchParams }: { searchParams: { error?: string } }) {
  const { authEnabled, providers, showTestLogin } = memberSignInOptions();
  const member = await currentMember().catch(() => undefined);
  if (member) redirect(member.nickname ? '/lobby' : '/onboarding');

  const providerButtons = providers.map((provider) =>
    typeof provider === 'function' ? provider() : provider,
  );

  async function signInWithProvider(formData: FormData) {
    'use server';
    if (!memberFeaturesEnabled() || !process.env.AUTH_SECRET) redirect('/lobby');
    const provider = formData.get('provider');
    if (typeof provider === 'string') await signIn(provider, { redirectTo: '/lobby' });
  }

  return (
    <main>
      <AppHeader />
      <PaperCard className="member-card" padding={28}>
        <h1>會員登入 <span className="en-cap">Sign in</span></h1>
        {searchParams.error && <p role="alert">登入失敗，請再試一次。 Sign-in failed. Try again.</p>}
        {!authEnabled && <p>會員功能暫停使用 · Member features are temporarily unavailable</p>}
        {authEnabled && providerButtons.length === 0 && !showTestLogin && (
          <p>會員登入尚未開放 · Member sign-in is coming soon.</p>
        )}
        {providerButtons.length > 0 && (
          <form action={signInWithProvider} className="member-card-actions">
            {providerButtons.map(({ id, name }) => (
              <StickerButton key={id} type="submit" name="provider" value={id}>
                使用 {name} 登入 · Sign in with {name}
              </StickerButton>
            ))}
          </form>
        )}
        {showTestLogin && (
          <form action="/api/test-login" method="post">
            <StickerButton type="submit">測試登入 · Test sign in</StickerButton>
          </form>
        )}
        <Link href="/lobby">返回大廳 · Back to lobby</Link>
      </PaperCard>
    </main>
  );
}
