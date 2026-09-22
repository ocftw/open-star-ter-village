import { AppHeader } from '@/components/design';
import ProjectCatalogLink from '@/components/ProjectCatalogLink';

const HOMEPAGE_URL = 'https://openstartervillage.ocf.tw';
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
          <a
            href={HOMEPAGE_URL}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}
          >
            規則 <span className="en-cap">Rules</span>
          </a>
          <a
            href={GITHUB_URL}
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
