import { StickerButton } from '@/components/design';

/**
 * Replaces the waiting note once the game is over, for players and observers
 * alike. The button reopens the results dialog, where they can leave or
 * start another game.
 */
export default function GameOverNote({ onShowResults }: { onShowResults: () => void }) {
  return (
    <div
      data-testid="game-over-note"
      className="paper-card"
      style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        fontSize: 13,
        color: 'var(--ink-soft)',
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ color: 'var(--ink)' }}>🏁 遊戲結束</strong>{' '}
        <span className="en-cap">Game over</span>
      </span>
      <StickerButton size="sm" onClick={onShowResults} data-testid="show-game-results">
        查看結算 <span className="tag-en" style={{ color: 'rgba(255,255,255,0.85)' }}>Results</span>
      </StickerButton>
    </div>
  );
}
