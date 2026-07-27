import React from 'react';
import { PlayerID } from 'boardgame.io';
import { AppHeader, PLAYER_COLORS } from '@/components/design';
import { GameContext } from '@/components/GameContextHelpers';
import { PlayersSelector } from '@/game/store/slice/players';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import { getPlayerName } from '@/components/playerNameMap';
import ExitDialog from './ExitDialog';
import RoundBadge from './RoundBadge';

/** Sticky table header: shared app shell + round badge + per-player status
 *  chips (design: GameHeader). `compact` (mobile): only the seated player's
 *  chip + a ⋯ menu holding the secondary actions; desktop shows every chip,
 *  the hints ⓘ toggle, and a Leave button. Leaving always goes through the
 *  explicit exit-choice dialog (#420). */
export default function GameHeader({
  gameContext,
  compact = false,
  hintsOn,
  onToggleHints,
}: {
  gameContext: GameContext;
  compact?: boolean;
  hintsOn?: boolean;
  onToggleHints?: () => void;
}) {
  const { G, ctx, playerID, matchData, matchID } = gameContext;
  const [exitOpen, setExitOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Mobile shows only your own chip; observers keep the full row.
  const chipIDs =
    compact && playerID !== null && G.players[playerID]
      ? [playerID]
      : Object.keys(G.players);

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
          <RoundBadge gameContext={gameContext} compact={compact} />
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: compact ? 'nowrap' : 'wrap',
              overflowX: compact ? 'auto' : 'visible',
              minWidth: 0,
              flex: compact ? 1 : undefined,
              justifyContent: compact ? 'flex-end' : undefined,
              // Headroom for the TURN badge that overflows the active chip.
              paddingTop: 8,
            }}
          >
            {chipIDs.map((id) => (
              <PlayerHeaderChip
                key={id}
                id={id}
                name={getPlayerName(matchData, id)}
                workers={PlayersSelector.getNumWorkerTokens(G.players, id)}
                actions={PlayersSelector.getNumActionTokens(G.players, id)}
                score={ScoreBoardSelector.getPlayerPoints(G.table.scoreBoard, id)}
                active={id === ctx.currentPlayer}
                you={id === playerID}
              />
            ))}
          </div>
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
                    {onToggleHints && (
                      <button
                        type="button"
                        role="menuitem"
                        className="menu-item"
                        data-testid="menu-hints"
                        onClick={() => {
                          onToggleHints();
                          setMenuOpen(false);
                        }}
                      >
                        ⓘ {hintsOn ? '隱藏操作提示' : '顯示操作提示'}
                      </button>
                    )}
                    <button type="button" role="menuitem" className="menu-item" data-testid="menu-leave" onClick={openExit}>
                      🚪 離開遊戲 <span className="tag-en">Leave</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
              {onToggleHints && (
                <button
                  type="button"
                  className="icon-btn"
                  data-testid="hints-toggle"
                  onClick={onToggleHints}
                  aria-label={hintsOn ? '隱藏操作提示 · Hide hints' : '顯示操作提示 · Show hints'}
                  title={hintsOn ? '隱藏操作提示 · Hide hints' : '顯示操作提示 · Show hints'}
                  aria-pressed={hintsOn}
                >
                  ⓘ
                </button>
              )}
              <button
                type="button"
                className="btn-sticker sm ghost"
                data-testid="header-leave"
                onClick={openExit}
              >
                離開 <span className="tag-en">Leave</span>
              </button>
            </div>
          )}
          {/* Mounted lazily: ExitDialog uses the app router, which only exists
              once the user can actually open it. */}
          {exitOpen && <ExitDialog open onClose={() => setExitOpen(false)} matchID={matchID} />}
        </>
      }
    />
  );
}

function PlayerHeaderChip({
  id,
  name,
  workers,
  actions,
  score,
  active,
  you,
}: {
  id: PlayerID;
  name: string;
  workers: number;
  actions: number;
  score: number;
  active: boolean;
  you: boolean;
}) {
  return (
    <div
      data-testid={`player-status-${name}`}
      data-workers={workers}
      data-actions={actions}
      data-score={score}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px 4px 4px',
        background: active ? '#fff5ef' : 'white',
        border: active ? '2px solid var(--orange)' : '1.5px solid var(--ink)',
        borderRadius: 999,
        boxShadow: active ? '0 3px 0 var(--orange)' : '0 2px 0 var(--ink)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: PLAYER_COLORS[Number(id) % PLAYER_COLORS.length],
          color: 'white',
          border: '1.5px solid var(--ink)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-en)',
          fontWeight: 800,
          fontSize: 12,
        }}
      >
        {name[0]}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <div style={{ fontSize: 12, fontWeight: 800 }}>
          {name}
          {you && <span style={{ color: 'var(--orange)', marginLeft: 4 }}>YOU</span>}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 2,
            fontFamily: 'var(--font-en)',
            fontSize: 10,
            color: 'var(--ink-soft)',
          }}
        >
          <span title="工人 Workers">👥 {workers}</span>
          <span title="行動點 Actions">⚡ {actions}</span>
          <span title="影響力 Score">★ {score}</span>
        </div>
      </div>
      {active && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: -6,
            background: 'var(--orange)',
            color: 'white',
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.06em',
            padding: '1px 6px',
            borderRadius: 999,
            border: '1.5px solid var(--ink)',
          }}
        >
          TURN
        </div>
      )}
    </div>
  );
}
