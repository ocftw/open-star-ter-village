/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { GameContext } from '@/components/GameContextHelpers';
import GameStore from '@/game/store/store';
import GameHistory, { useGameHistory } from './GameHistory';
import type { HistoryEntry } from './gameHistory';

const entries: HistoryEntry[] = [{ id: 'round:1', text: '第 1 輪開始' }];
const action = { id: 'move:1', text: '招募人力', playerID: '0' };

function scrollArea() {
  const list = screen.getByTestId('game-history-list');
  Object.defineProperties(list, {
    scrollHeight: { configurable: true, value: 500 },
    clientHeight: { configurable: true, value: 180 },
  });
  return list;
}

it('shows oldest first, with lobby names and plain-text lines', () => {
  render(<GameHistory entries={[...entries, action]} matchData={[{ id: 0, name: '小明' }]} />);
  expect(screen.getByRole('heading', { name: '遊戲歷程' })).toBeTruthy();
  expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['第 1 輪開始', '小明 · 招募人力']);
  expect(screen.getByRole('list', { name: '遊戲歷程紀錄' }).tabIndex).toBe(0);
});

it('sticks to the newest entry while already at the bottom', () => {
  const { rerender } = render(<GameHistory entries={entries} matchData={undefined} />);
  const list = scrollArea();
  list.scrollTop = 320;
  fireEvent.scroll(list);
  Object.defineProperty(list, 'scrollHeight', { value: 600 });
  rerender(<GameHistory entries={[...entries, action]} matchData={undefined} />);
  // jsdom does not clamp scrollTop to the maximum as a browser does.
  expect(list.scrollTop).toBe(600);
});

it('holds position when scrolled up and resumes sticking after returning to the bottom', () => {
  const { rerender } = render(<GameHistory entries={entries} matchData={undefined} />);
  const list = scrollArea();
  list.scrollTop = 40;
  fireEvent.scroll(list);
  rerender(<GameHistory entries={[...entries, action]} matchData={undefined} />);
  expect(list.scrollTop).toBe(40);
  list.scrollTop = 320;
  fireEvent.scroll(list);
  Object.defineProperty(list, 'scrollHeight', { value: 700 });
  rerender(<GameHistory entries={[...entries, action, { id: 'move:2', text: '換人力' }]} matchData={undefined} />);
  expect(list.scrollTop).toBe(700);
});

function context(): GameContext {
  const G = GameStore.initialState();
  G.table.round = 1;
  G.table.scoreBoard['0'] = 0;
  return { G, ctx: { turn: 1, numPlayers: 3 }, log: [], matchID: 'match-a' } as unknown as GameContext;
}

function Harness({ gameContext, mobile = false }: { gameContext: GameContext; mobile?: boolean }) {
  const history = useGameHistory(gameContext);
  const panel = <GameHistory entries={history} matchData={gameContext.matchData} />;
  return mobile ? <main>{panel}</main> : <aside><div>{panel}</div></aside>;
}

it('retains observations through panel remounts and clears them for a different match', () => {
  const initial = context();
  const { rerender } = render(<React.StrictMode><Harness gameContext={initial} /></React.StrictMode>);
  const next = { ...initial, G: { ...initial.G, table: { ...initial.G.table, scoreBoard: { '0': 2 } } } };
  rerender(<React.StrictMode><Harness gameContext={next} /></React.StrictMode>);
  expect(screen.getByText('影響力 +2', { exact: false })).toBeTruthy();
  rerender(<React.StrictMode><Harness gameContext={next} mobile /></React.StrictMode>);
  expect(screen.getAllByRole('listitem').filter((item) => item.textContent?.includes('影響力 +2'))).toHaveLength(1);
  rerender(<React.StrictMode><Harness gameContext={{ ...next, matchID: 'match-b' }} mobile /></React.StrictMode>);
  expect(screen.queryByText('影響力 +2', { exact: false })).toBeNull();
});
