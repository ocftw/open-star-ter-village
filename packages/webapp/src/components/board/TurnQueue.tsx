import React from 'react';
import { GameContext } from '@/components/GameContextHelpers';
import { PLAYER_COLORS } from '@/components/design';
import { getPlayerName } from '@/components/playerNameMap';
import { buildTurnQueue } from './turnQueue';

export default function TurnQueue({ gameContext, horizontal = false }: {
  gameContext: GameContext;
  horizontal?: boolean;
}) {
  const { G, ctx, matchData } = gameContext;
  const queue = buildTurnQueue(G.playOrder, ctx.playOrderPos);
  const current = queue[0];
  const previous = React.useRef({ turn: ctx.turn, player: current });
  const [leaving, setLeaving] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (previous.current.turn === ctx.turn) return;
    const oldPlayer = previous.current.player;
    previous.current = { turn: ctx.turn, player: current };
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setLeaving(oldPlayer);
    const timeout = window.setTimeout(() => setLeaving(null), 400);
    return () => window.clearTimeout(timeout);
  }, [ctx.turn, current]);

  if (!current) return null;
  const name = (id: string) => getPlayerName(matchData, id);
  const dot = (id: string, index: number, exiting = false) => {
    const size = horizontal ? (index === 0 ? 34 : 24) : (index === 0 ? 64 : 34);
    const offset = index === 0 ? 0 : horizontal ? 42 + (index - 1) * 18 : 74 + (index - 1) * 26;
    return (
      <span
        key={exiting ? 'exit' : ctx.turn + index}
        className={`turn-queue-dot${exiting ? ' turn-queue-exit' : ''}`}
        data-testid={exiting ? 'turn-queue-exit' : index === 0 ? 'turn-queue-current' : 'turn-queue-next'}
        data-player-id={id}
        title={name(id)}
        aria-hidden="true"
        style={{
          width: size, height: size, fontSize: size * 0.45,
          transform: horizontal ? `translate(${offset}px, -50%)` : `translate(-50%, -${offset}px)`,
          background: PLAYER_COLORS[Number(id) % PLAYER_COLORS.length],
          zIndex: exiting ? 51 : 50 - index,
        }}
      >
        {Array.from(name(id))[0]}
      </span>
    );
  };

  return (
    <div
      className={`turn-queue${horizontal ? ' turn-queue-horizontal' : ''}`}
      data-testid="turn-queue"
      role="group"
      aria-label={`玩家順序：目前 ${name(current)}，接著 ${queue.slice(1).map(name).join('、')}`}
    >
      {queue.map((id, index) => dot(id, index))}
      {leaving && dot(leaving, 0, true)}
      {!horizontal && <small className="turn-queue-name" aria-hidden="true">{name(current)}</small>}
    </div>
  );
}
