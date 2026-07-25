'use client';

import type { ComponentProps, Key, ReactNode } from 'react';
import Boardgame from '@/components/BoardGame';

export type GameViewProps = ComponentProps<typeof Boardgame> & {
  boardKey?: Key;
  widgets?: ReactNode;
};

/**
 * Shared in-game shell. Production game rooms render it without widgets,
 * while development tools can be composed into the overlay slot.
 */
export default function GameView({ boardKey, widgets, ...boardProps }: GameViewProps) {
  const isObserver = boardProps.playerID == null;

  return (
    <main>
      {isObserver && (
        <div
          data-testid="observer-mode-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            background: 'var(--ink)',
            color: 'white',
            fontSize: 13,
          }}
        >
          <span aria-hidden>👀</span>
          觀戰模式：這個瀏覽器沒有座位。
          <span className="en-cap" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Observer mode — no seat claimed in this browser
          </span>
        </div>
      )}
      <Boardgame key={boardKey} {...boardProps} />
      {widgets}
    </main>
  );
}
