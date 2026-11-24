/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { GameContext } from '@/components/GameContextHelpers';
import GameStore from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { RuleMutator } from '@/game/store/slice/rule';
import { toggleJobSlotSelection } from '@/lib/reducers/jobSlotSlice';
import { ProjectCard } from '@/game/card';
import { makeStore } from '@/lib/store';
import { UserActionMoves, setCurrentAction, setHandProjectCardsInteractive } from '@/lib/reducers/actionStepSlice';
import HandPanel from './HandPanel';

const cards: ProjectCard[] = ['a', 'b', 'c'].map((id, i) => ({
  id, name: `專案${id}`, type: '開放政府', difficulty: i + 1, description: '', requirements: { 工程師: 2 + i },
}));

function setup(opts: { wild?: boolean; hand?: ProjectCard[]; playerID?: string | null; layout?: 'rail' | 'strip' } = {}) {
  const { hand = cards, playerID = '0', layout, wild = false } = opts;
  const G = GameStore.initialState();
  PlayersMutator.initialize(G.players, ['0', '1']);
  PlayersMutator.addProjects(G.players, '0', hand);
  if (wild) {
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
    G.table.jobSlots = [{ id: 'legal', name: '法務專家' }];
  }
  const gameContext = { G, ctx: { currentPlayer: '0' }, moves: {}, playerID } as unknown as GameContext;
  const store = makeStore();
  const view = render(
    <Provider store={store}>
      <HandPanel gameContext={gameContext} layout={layout} />
    </Provider>,
  );
  return { ...view, store };
}

test('renders the labelled panel with cards in hand order and no count sticker', () => {
  setup();
  const panel = screen.getByTestId('hand-panel');
  expect(panel.getAttribute('aria-label')).toBe('你的手牌');
  expect(within(panel).getByRole('heading', { name: '你的手牌' })).toBeTruthy();
  expect(within(panel).getByText('YOUR HAND')).toBeTruthy();
  expect(panel.querySelector('.sticker')).toBeNull();
  const ids = Array.from(panel.querySelectorAll('[data-testid^="hand-card-"]')).map((el) => el.getAttribute('data-testid'));
  expect(ids).toEqual(['hand-card-a', 'hand-card-b', 'hand-card-c']);
});

test('strip layout keeps the same cards in the panel', () => {
  setup({ layout: 'strip' });
  expect(screen.getByTestId('hand-panel').classList.contains('hand-panel--strip')).toBe(true);
  expect(screen.getAllByTestId(/^hand-card-/)).toHaveLength(3);
});

test('shows the empty copy when there are no cards', () => {
  setup({ hand: [] });
  expect(screen.getByText('沒有手牌 · No cards in hand')).toBeTruthy();
  expect(screen.queryAllByTestId(/^hand-card-/)).toHaveLength(0);
});

test('renders nothing for an observer', () => {
  setup({ playerID: null });
  expect(screen.queryByTestId('hand-panel')).toBeNull();
});

test('idle cards are noninteractive full-colour faces', () => {
  setup();
  const first = screen.getByTestId('hand-card-a');
  expect(first.hasAttribute('tabindex')).toBe(false);
  expect(first.hasAttribute('role')).toBe(false);
  fireEvent.click(first);
  expect(first.getAttribute('data-visual-state')).toBe('default');
});

test('while creating a project the hand is single-select and keyboard operable', () => {
  const { store } = setup();
  act(() => {
    store.dispatch(setCurrentAction(UserActionMoves.CreateProject));
    store.dispatch(setHandProjectCardsInteractive());
  });
  const a = screen.getByTestId('hand-card-a');
  const b = screen.getByTestId('hand-card-b');
  expect(a.getAttribute('tabindex')).toBe('0');
  fireEvent.keyDown(a, { key: 'Enter' });
  expect(a.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(b);
  expect(a.getAttribute('aria-pressed')).toBe('false');
  expect(b.getAttribute('aria-pressed')).toBe('true');
  fireEvent.keyDown(b, { key: ' ' });
  expect(b.getAttribute('aria-pressed')).toBe('false');
});

test('START leaves profession target controls out of the hand', () => {
  const { store } = setup({ wild: true });
  act(() => {
    store.dispatch(setCurrentAction(UserActionMoves.CreateProject));
    store.dispatch(setHandProjectCardsInteractive());
    store.dispatch(toggleJobSlotSelection('legal'));
  });
  fireEvent.click(screen.getByTestId('hand-card-a'));
  expect(screen.queryAllByTestId(/^profession-target-/)).toHaveLength(0);
});
