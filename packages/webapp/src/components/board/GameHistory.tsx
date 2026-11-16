import React, { useLayoutEffect, useRef, useState } from 'react';
import type { GameContext } from '@/components/GameContextHelpers';
import { getPlayerName } from '@/components/playerNameMap';
import { buildGameHistory, type HistoryEntry } from './gameHistory';

// Keep session observations above the responsive branches, which remount the panel.
export function useGameHistory(gameContext: GameContext) {
  const [history, setHistory] = useState(() => ({ ...buildGameHistory(gameContext), matchID: gameContext.matchID }));
  if (history.source.G !== gameContext.G || history.source.ctx !== gameContext.ctx || history.source.log !== gameContext.log || history.matchID !== gameContext.matchID) {
    setHistory({
      ...buildGameHistory(gameContext, history.matchID === gameContext.matchID ? history : undefined),
      matchID: gameContext.matchID,
    });
  }
  return history.entries;
}

export default function GameHistory({ entries, matchData }: {
  entries: HistoryEntry[];
  matchData: GameContext['matchData'];
}) {
  const list = useRef<HTMLUListElement>(null);
  const atBottom = useRef(true);

  useLayoutEffect(() => {
    if (atBottom.current && list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [entries]);

  return (
    <section className="game-history" aria-label="遊戲歷程" data-testid="game-history">
      <h3>遊戲歷程</h3>
      <ul
        ref={list}
        tabIndex={0}
        aria-label="遊戲歷程紀錄"
        data-testid="game-history-list"
        onScroll={(event) => {
          const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
          atBottom.current = scrollHeight - scrollTop - clientHeight <= 4;
        }}
      >
        {entries.map((entry) => (
          <li key={entry.id}>
            {entry.playerID !== undefined && <><b>{getPlayerName(matchData, entry.playerID)}</b> · </>}
            {entry.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
