import { AppHeader, StickerButton } from '@/components/design';
import ProjectCatalogLink from '@/components/ProjectCatalogLink';
import Link from 'next/link';

const GITHUB_URL = 'https://github.com/ocftw/open-star-ter-village';

export type MemberNotice = 'unavailable' | 'coming-soon';

/** Shared with /sign-in so both pages say the same thing. */
export const MEMBER_NOTICE_COPY: Record<MemberNotice, { full: string; compact: string }> = {
  unavailable: { full: '會員功能暫停使用 · Member features are temporarily unavailable', compact: '會員暫停 · Members paused' },
  'coming-soon': { full: '會員登入尚未開放 · Member sign-in is coming soon', compact: '會員即將開放 · Sign-in soon' },
};

export default function LobbyNav({
  member,
}: {
  member?: { available: boolean; notice?: MemberNotice; nickname?: string; signOut: () => Promise<void> };
}) {
  return (
    <AppHeader
      right={
        <nav className="lobby-nav-links">
          <ProjectCatalogLink
            placement="header"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}
          >
            <span className="catalog-label-full">
              探索專案卡 <span className="en-cap">Explore project cards</span>
            </span>
            <span className="catalog-label-compact">專案卡</span>
          </ProjectCatalogLink>
          <Link
            href="/rules"
            data-analytics-id="rules"
            data-analytics-placement="header"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}
          >
            規則 <span className="en-cap">Rules</span>
          </Link>
          <a
            href={GITHUB_URL}
            data-analytics-id="source_repository"
            data-analytics-placement="header"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}
          >
            GitHub
          </a>
          {member?.available && (
            member.nickname ? (
              <form className="lobby-member" action={member.signOut}>
                <strong className="lobby-nickname">{member.nickname}</strong>
                <StickerButton type="submit" variant="ghost" size="sm">登出 · Sign out</StickerButton>
              </form>
            ) : (
              <Link className="btn-sticker sm" href="/sign-in">登入 · Sign in</Link>
            )
          )}
          {member && !member.available && (
            <small className="lobby-member-notice" title={MEMBER_NOTICE_COPY[member.notice ?? 'unavailable'].full}>
              <span className="member-notice-full">{MEMBER_NOTICE_COPY[member.notice ?? 'unavailable'].full}</span>
              <span className="member-notice-compact">{MEMBER_NOTICE_COPY[member.notice ?? 'unavailable'].compact}</span>
            </small>
          )}
        </nav>
      }
    />
  );
}
