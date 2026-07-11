import Link from 'next/link';
import { CharacterAvatar } from '@/components/design';
import type { JobRole } from '@/components/design';
import LobbyNav from '@/components/lobby/LobbyNav';

const HOMEPAGE_URL = 'https://openstartervillage.ocf.tw';

const STATS = [
  { value: '3–6', zh: '玩家', en: 'PLAYERS' },
  { value: '~60', zh: '分鐘', en: 'MINUTES' },
  { value: '70+', zh: '專案卡', en: 'PROJECTS' },
] as const;

/** Floating character stickers on the hero's right side. */
const HERO_CHARACTERS: Array<{ role: JobRole; zh: string; rotate: number; x: string; y: string }> = [
  { role: 'eng', zh: '工程師', rotate: -6, x: '4%', y: '6%' },
  { role: 'design', zh: '美術設計', rotate: 5, x: '56%', y: '0%' },
  { role: 'civil', zh: '公務人員', rotate: 3, x: '10%', y: '52%' },
  { role: 'issue', zh: '議題工作者', rotate: -4, x: '62%', y: '46%' },
  { role: 'writer', zh: '文字工作者', rotate: 8, x: '34%', y: '26%' },
];

export default function Home() {
  return (
    <main style={{ minHeight: '100vh' }}>
      <LobbyNav />
      <div className="page-pad grid-hero">
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--orange-soft)',
              color: 'var(--orange-deep)',
              border: '1.5px solid var(--orange)',
              borderRadius: 999,
              padding: '5px 14px',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 18,
            }}
          >
            🎲 桌遊上線版 · Now playable online
          </div>
          <h1 className="h-display" style={{ fontSize: 56 }}>
            一起來蓋
            <br />
            <span style={{ color: 'var(--orange)' }}>開源</span>之村
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-en)',
              fontSize: 16,
              color: 'var(--ink-soft)',
              marginTop: 12,
              lineHeight: 1.45,
            }}
          >
            Build open-source projects together. Recruit your team,
            <br />
            ship contributions, and discover what open really means.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <Link href="/lobby" className="btn-sticker">
              開始遊戲{' '}
              <span style={{ opacity: 0.8, fontFamily: 'var(--font-en)', fontWeight: 500 }}>
                · Play online
              </span>
            </Link>
            <a href={HOMEPAGE_URL} target="_blank" rel="noreferrer" className="btn-sticker ghost">
              如何遊玩{' '}
              <span style={{ opacity: 0.6, fontFamily: 'var(--font-en)', fontWeight: 500 }}>
                · How to play
              </span>
            </a>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 36 }}>
            {STATS.map((stat) => (
              <div key={stat.en}>
                <div
                  style={{
                    fontFamily: 'var(--font-en)',
                    fontWeight: 900,
                    fontSize: 28,
                    color: 'var(--ink)',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>
                  {stat.zh}
                </div>
                <div className="en-cap" style={{ marginTop: 2 }}>
                  {stat.en}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating character stickers (card components arrive in PR 3) */}
        <div style={{ position: 'relative', height: 420 }} aria-hidden>
          {HERO_CHARACTERS.map((c) => (
            <div
              key={c.role}
              style={{
                position: 'absolute',
                left: c.x,
                top: c.y,
                transform: `rotate(${c.rotate}deg)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CharacterAvatar role={c.role} size="xl" />
              <span className="sticker">{c.zh}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
