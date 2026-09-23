import { AppHeader } from '@/components/design';
import ProjectCatalogLink from '@/components/ProjectCatalogLink';
import Link from 'next/link';

const GITHUB_URL = 'https://github.com/ocftw/open-star-ter-village';

export default function LobbyNav() {
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
        </nav>
      }
    />
  );
}
