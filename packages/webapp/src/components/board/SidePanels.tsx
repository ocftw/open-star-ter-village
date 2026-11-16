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
                    className="influence-ranking-name"
                    title={name}
                    style={{ color: you ? 'var(--orange-deep)' : undefined }}
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
