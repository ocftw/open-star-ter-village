import { AppHeader, StickerButton } from '@/components/design';
import ProjectCatalogLink from '@/components/ProjectCatalogLink';
import Link from 'next/link';

const GITHUB_URL = 'https://github.com/ocftw/open-star-ter-village';

export default function LobbyNav({
  member,
}: {
  member?: { available: boolean; nickname?: string; signOut: () => Promise<void> };
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
            <small className="lobby-member-notice">
              會員功能暫停使用 · Member features are temporarily unavailable
            </small>
          )}
        </nav>
      }
    />
  );
}
