import React from 'react';
import Link from 'next/link';
import { AppHeader, Button } from '@/components/design';
import { GameContext } from '@/components/GameContextHelpers';
import ExitDialog from './ExitDialog';

/** Shared app shell with round context; compact bars keep actions in the ⋯ menu. */
export default function GameHeader({
  gameContext,
  compact = false,
}: {
  gameContext: GameContext;
  compact?: boolean;
}) {
  const { G, matchID } = gameContext;
  const [exitOpen, setExitOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const openExit = () => {
    setMenuOpen(false);
    setExitOpen(true);
  };

  return (
    <AppHeader
      sticky
      compact={compact}
      right={
        <>
          <span className="game-header-round" data-testid="header-round">
            第 {G.table.round} 輪
            {!compact && G.table.eventSlot && ` · ${G.table.eventSlot.name}`}
          </span>
          {compact ? (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                className="icon-btn"
                aria-label="選單 · Menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                data-testid="header-menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                ⋯
              </button>
              {menuOpen && (
                <>
                  <div
                    aria-hidden
                    onClick={() => setMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  />
                  <div
                    role="menu"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 6px)',
                      zIndex: 41,
                      background: 'white',
                      border: '2px solid var(--ink)',
                      borderRadius: 14,
                      boxShadow: 'var(--shadow-sticker)',
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      minWidth: 190,
                    }}
                  >
                    <Link href="/rules" target="_blank" rel="noreferrer" role="menuitem" className="menu-item" data-analytics-id="game_rules">
                      📖 遊戲規則 <span className="tag-en">RULES</span>
                    </Link>
                    <button type="button" role="menuitem" className="menu-item" data-testid="menu-leave" onClick={openExit}>
                      🚪 離開遊戲 <span className="tag-en">Leave</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/rules" target="_blank" rel="noreferrer" className="gr-btn gr-btn--medium gr-btn--sec game-header-action" data-analytics-id="game_rules">
                規則 <span className="tag-en">RULES</span>
              </Link>
              <Button
                variant="sec"
                className="game-header-action"
                data-testid="header-leave"
                onClick={openExit}
              >
                離開 <span className="tag-en">LEAVE</span>
              </Button>
            </>
          )}
          {/* Mounted lazily: ExitDialog uses the app router, which only exists
              once the user can actually open it. */}
          {exitOpen && <ExitDialog open onClose={() => setExitOpen(false)} matchID={matchID} />}
        </>
      }
    />
  );
}
