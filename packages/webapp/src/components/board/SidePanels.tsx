import { GameContext } from '@/components/GameContextHelpers';
import { PLAYER_COLORS } from '@/components/design';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import { playerNameMap } from '@/components/playerNameMap';

/** Right-rail victory point board (design: ScoreBoard). */
export function ScorePanel({ gameContext }: { gameContext: GameContext }) {
  const { G } = gameContext;
  const points = ScoreBoardSelector.getAllPlayerPoints(G.table.scoreBoard);
  const entries = Object.entries(points).sort(([, a], [, b]) => b - a);
  const max = Math.max(...entries.map(([, p]) => p), 6);
  return (
    <div className="paper-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>影響力</span>
        <span className="en-cap">Victory points</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {entries.map(([id, score], rank) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="en-cap" style={{ width: 12, color: 'var(--ink-mute)' }}>
              {rank + 1}
            </span>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                background: PLAYER_COLORS[Number(id) % PLAYER_COLORS.length],
                color: 'white',
                border: '1.5px solid var(--ink)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-en)',
                fontWeight: 800,
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              {playerNameMap[id]?.[0]}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{playerNameMap[id]}</span>
            <div
              style={{
                flex: 2,
                height: 12,
                borderRadius: 6,
                background: 'var(--paper-2)',
                border: '1.5px solid var(--ink)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(score / max) * 100}%`,
                  height: '100%',
                  background: PLAYER_COLORS[Number(id) % PLAYER_COLORS.length],
                }}
              />
            </div>
            <strong
              style={{ fontFamily: 'var(--font-en)', fontSize: 14, minWidth: 24, textAlign: 'right' }}
            >
              {score}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Right-rail turn order strip (design: RoundProgress). */
export function TurnOrderPanel({ gameContext }: { gameContext: GameContext }) {
  const { G, ctx } = gameContext;
  const ids = Object.keys(G.players);
  return (
    <div className="paper-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>回合順序</span>
        <span className="en-cap">Turn order</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center' }}>
        {ids.map((id, i) => {
          const active = id === ctx.currentPlayer;
          return (
            <span key={id} style={{ display: 'contents' }}>
              <span
                title={playerNameMap[id]}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: active ? PLAYER_COLORS[Number(id) % PLAYER_COLORS.length] : 'white',
                  color: active ? 'white' : 'var(--ink)',
                  border: active ? '2.5px solid var(--ink)' : '1.5px solid var(--ink)',
                  boxShadow: active ? '0 2px 0 var(--ink)' : 'none',
                  opacity: active ? 1 : 0.45,
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-en)',
                  fontWeight: 800,
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {playerNameMap[id]?.[0]}
              </span>
              {i < ids.length - 1 && (
                <span style={{ flex: 1, height: 2, background: 'var(--paper-3)', borderRadius: 1 }} />
              )}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-soft)' }}>
        現在輪到 <strong>{playerNameMap[ctx.currentPlayer]}</strong>
      </div>
    </div>
  );
}
