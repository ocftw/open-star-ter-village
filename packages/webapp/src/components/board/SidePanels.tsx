import { GameContext } from '@/components/GameContextHelpers';
import { PLAYER_COLORS } from '@/components/design';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import { getPlayerName } from '@/components/playerNameMap';
import { PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';

/** Influence ranking: score ties retain seat order, regardless of turn order. */
export function ScorePanel({ gameContext }: { gameContext: GameContext }) {
  const { G, matchData, playerID } = gameContext;
  const points = ScoreBoardSelector.getAllPlayerPoints(G.table.scoreBoard);
  const entries = Object.keys(G.players)
    .map((id) => [id, points[id]] as const)
    .sort(([, a], [, b]) => b - a);
  const maxScore = Math.max(1, ...entries.map(([, score]) => score));
  const maxWorkers = RuleSelector.getPlayerMaxWorkerTokens(G.rules);
  return (
    <section className="influence-ranking" aria-label="影響力排行" data-testid="influence-ranking">
      <h3>影響力排行</h3>
      <ol>
        {entries.map(([id, score], rank) => {
          const name = getPlayerName(matchData, id);
          const workers = PlayersSelector.getNumWorkerTokens(G.players, id);
          const you = id === playerID;
          return (
            <li
              key={id}
              className="influence-ranking-row"
              data-testid={`ranking-row-${name}`}
              data-score={score}
              data-workers={workers}
              data-actions={PlayersSelector.getNumActionTokens(G.players, id)}
              data-you={you}
            >
              <span className="influence-ranking-rank">{rank + 1}</span>
              <span
                className="influence-ranking-badge"
                style={{ background: PLAYER_COLORS[Number(id) % PLAYER_COLORS.length] }}
                aria-hidden="true"
              >
                {name[0]}
              </span>
              <div className="influence-ranking-details">
                <div className="influence-ranking-topline">
                  <span
                    className={you ? 'influence-ranking-name influence-ranking-name-you' : 'influence-ranking-name'}
                    title={name}
                  >
                    {name}
                  </span>
                  <div className="influence-ranking-line">
                    <span aria-hidden="true">★</span>
                    <span
                      className="influence-ranking-bar influence-ranking-score"
                      role="meter"
                      aria-label={`${name} 影響力`}
                      aria-valuemin={0}
                      aria-valuemax={maxScore}
                      aria-valuenow={score}
                    >
                      <i style={{ width: `${(score / maxScore) * 100}%` }} />
                    </span>
                    <b>{score}</b>
                  </div>
                </div>
                <div className="influence-ranking-line">
                  <span aria-hidden="true">👥</span>
                  <span
                    className="influence-ranking-bar influence-ranking-workers"
                    role="meter"
                    aria-label={`${name} 剩餘人力`}
                    aria-valuemin={0}
                    aria-valuemax={maxWorkers}
                    aria-valuenow={workers}
                  >
                    <i style={{ width: `${(workers / maxWorkers) * 100}%` }} />
                  </span>
                  <b>{String(workers).padStart(2, '0')}</b>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Right-rail turn order strip (design: RoundProgress). */
export function TurnOrderPanel({ gameContext }: { gameContext: GameContext }) {
  const { G, ctx, matchData } = gameContext;
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
                title={getPlayerName(matchData, id)}
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
                {getPlayerName(matchData, id)[0]}
              </span>
              {i < ids.length - 1 && (
                <span style={{ flex: 1, height: 2, background: 'var(--paper-3)', borderRadius: 1 }} />
              )}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-soft)' }}>
        現在輪到 <strong>{getPlayerName(matchData, ctx.currentPlayer)}</strong>
      </div>
    </div>
  );
}
