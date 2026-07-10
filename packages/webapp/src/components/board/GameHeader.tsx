import Link from 'next/link';
import { PlayerID } from 'boardgame.io';
import { Logo, PLAYER_COLORS } from '@/components/design';
import { GameContext } from '@/components/GameContextHelpers';
import { PlayersSelector } from '@/game/store/slice/players';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import { playerNameMap } from '@/components/playerNameMap';

/** Sticky table header: logo + per-player status chips (design: GameHeader). */
export default function GameHeader({ gameContext }: { gameContext: GameContext }) {
  const { G, ctx, playerID } = gameContext;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 20px',
        background: 'white',
        borderBottom: '2px solid var(--ink)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Logo size="sm" />
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
        {Object.keys(G.players).map((id) => (
          <PlayerHeaderChip
            key={id}
            id={id}
            name={playerNameMap[id]}
            workers={PlayersSelector.getNumWorkerTokens(G.players, id)}
            actions={PlayersSelector.getNumActionTokens(G.players, id)}
            score={ScoreBoardSelector.getPlayerPoints(G.table.scoreBoard, id)}
            active={id === ctx.currentPlayer}
            you={id === playerID}
          />
        ))}
      </div>
      <Link href="/lobby" className="btn-sticker sm ghost" style={{ marginLeft: 12 }}>
        離開 <span className="tag-en">Leave</span>
      </Link>
    </div>
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
