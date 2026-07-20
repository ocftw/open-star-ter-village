import { AppHeader } from '@/components/design';

const HOMEPAGE_URL = 'https://openstartervillage.ocf.tw';
const GITHUB_URL = 'https://github.com/ocftw/open-star-ter-village';

export default function LobbyNav() {
  return (
    <AppHeader
      right={
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
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
