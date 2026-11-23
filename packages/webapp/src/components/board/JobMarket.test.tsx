/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { GameContext } from '@/components/GameContextHelpers';
import GameStore, { GameState } from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';
import { ProjectBoardMutator } from '@/game/store/slice/projectBoard';
import { makeStore } from '@/lib/store';
import { UserActionMoves, setCurrentAction } from '@/lib/reducers/actionStepSlice';
import JobMarket from './JobMarket';

const NAMES = ['工程師', '美術設計', '公務人員', '法務專家', '文字工作者', '議題工作者', '行銷公關', '工程師'];

function setup({
  players = ['0', '1', '2'],
  playerID = '0' as string | null,
  jobs = 8,
  idle = true,
  names,
  change,
}: {
  players?: string[];
  playerID?: string | null;
  jobs?: number;
  idle?: boolean;
  names?: string[];
  change?: (G: GameState) => void;
} = {}) {
  const G = GameStore.initialState();
  PlayersMutator.initialize(G.players, players);
  PlayersMutator.resetActionTokens(G.players, '0', 4);
  ProjectBoardMutator.initialize(G.table.projectBoard, 8);
  JobSlotsMutator.addJobCards(
    G.table.jobSlots,
    Array.from({ length: jobs }, (_, i) => ({ id: `job-${i}`, name: NAMES[i % NAMES.length] })),
  );
  change?.(G);
  const matchData = players.map((id, i) => ({ id: Number(id), name: names?.[i] ?? ['Alice', 'Bob', 'Charlie', 'Dana'][i] }));
  const gameContext = {
    G, ctx: { currentPlayer: '0', turn: 1, numMoves: 0 }, moves: {}, playerID, matchData,
  } as unknown as GameContext;
  const store = makeStore();
  const view = render(
    <Provider store={store}>
      <JobMarket gameContext={gameContext} idle={idle} discardActive={false} />
    </Provider>,
  );
  return { ...view, G, store };
}

describe('JobMarket', () => {
  it('shows the heading, the card count and one tile per slot', () => {
    setup();
    expect(screen.getByRole('region', { name: '人力市場' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '人力市場' })).toBeTruthy();
    const count = screen.getByTestId('job-market-count');
    expect(count.textContent).toBe('JOB MARKET · 8 CARDS');
    expect(count.getAttribute('data-count')).toBe('8');
    for (let i = 0; i < 8; i++) expect(screen.getByTestId(`job-card-job-${i}`)).toBeTruthy();
    expect(screen.queryByText(/先選加入專案/)).toBeNull();
  });

  it('counts real cards only when the synthetic 斜槓青年 card is present', () => {
    setup({
      change: (G) => {
        G.table.jobSlots.unshift({ id: 'slash-0-1', name: '斜槓青年' });
      },
    });
    const count = screen.getByTestId('job-market-count');
    expect(count.textContent).toBe('JOB MARKET · 8 CARDS');
    expect(count.getAttribute('data-count')).toBe('8');
    expect(screen.getByTestId('job-card-slash-0-1').getAttribute('data-wild')).toBe('true');
  });

  it('names every player on the badge group and hides the dots from assistive tech', () => {
    setup();
    const badges = screen.getByTestId('job-market-players');
    expect(badges.getAttribute('role')).toBe('img');
    expect(badges.getAttribute('aria-label')).toBe('共用人力市場：Alice、Bob、Charlie');
    const dots = badges.querySelectorAll('.job-market__pdot');
    expect(Array.from(dots).map((d) => d.textContent)).toEqual(['A', 'B', 'C']);
    dots.forEach((d) => expect(d.getAttribute('aria-hidden')).toBe('true'));
  });

  it('handles four players with long names', () => {
    setup({
      players: ['0', '1', '2', '3'],
      names: ['Alexandria-Longname', '陳大文與小明的共同名稱', 'Bob', 'Dana'],
    });
    const badges = screen.getByTestId('job-market-players');
    expect(badges.getAttribute('aria-label')).toBe('共用人力市場：Alexandria-Longname、陳大文與小明的共同名稱、Bob、Dana');
    expect(badges.querySelectorAll('.job-market__pdot')).toHaveLength(4);
  });

  it('renders an enabled REFILL pill for a seated player when idle', () => {
    setup();
    const refill = screen.getByTestId('refill-jobs') as HTMLButtonElement;
    expect(refill.disabled).toBe(false);
    expect(refill.getAttribute('aria-pressed')).toBe('false');
    expect(within(refill).getByText('換人力')).toBeTruthy();
    expect(within(refill).getByText('REFILL')).toBeTruthy();
    expect(within(refill).getByLabelText('COST 1')).toBeTruthy();
    expect(within(refill).getByLabelText('換人力本回合剩餘 1 次')).toBeTruthy();
    expect(screen.getByTestId('job-market-actions').contains(refill)).toBe(true);
  });

  it('dispatches 換人力 when REFILL is clicked', () => {
    const { store } = setup();
    fireEvent.click(screen.getByTestId('refill-jobs'));
    expect(store.getState().actionSteps.currentAction).toBe(UserActionMoves.RemoveAndRefillJobs);
  });

  it('keeps REFILL visible but disabled when not idle, and pressed during 換人力', () => {
    const { store } = setup({ idle: false });
    const refill = screen.getByTestId('refill-jobs') as HTMLButtonElement;
    expect(refill.disabled).toBe(true);
    React.act(() => { store.dispatch(setCurrentAction(UserActionMoves.RemoveAndRefillJobs)); });
    expect(refill.getAttribute('aria-pressed')).toBe('true');
  });

  it('has no REFILL for observers but keeps badges, count and the action host', () => {
    setup({ playerID: null });
    expect(screen.queryByTestId('refill-jobs')).toBeNull();
    expect(screen.getByTestId('job-market-actions')).toBeTruthy();
    expect(screen.getByTestId('job-market-players')).toBeTruthy();
    expect(screen.getByTestId('job-market-count').getAttribute('data-count')).toBe('8');
  });

  it('shows an empty market: count 0, REFILL disabled, hosts kept, no tiles/arrows/fades', () => {
    const { container } = setup({ jobs: 0 });
    expect(screen.getByTestId('job-market-count').textContent).toBe('JOB MARKET · 0 CARDS');
    expect((screen.getByTestId('refill-jobs') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('job-market-row').children).toHaveLength(0);
    expect(screen.getByTestId('job-market-actions')).toBeTruthy();
    expect(screen.queryByTestId('job-market-prev')).toBeNull();
    expect(screen.queryByTestId('job-market-next')).toBeNull();
    expect(container.querySelector('.market-carousel__fade')).toBeNull();
  });

  it('omits REFILL for an observer on an empty market', () => {
    setup({ jobs: 0, playerID: null });
    expect(screen.queryByTestId('refill-jobs')).toBeNull();
    expect(screen.getByTestId('job-market-actions')).toBeTruthy();
  });

  it('exposes the keyboard-scrollable row', () => {
    setup();
    const row = screen.getByTestId('job-market-row');
    expect(row.getAttribute('tabindex')).toBe('0');
    expect(row.getAttribute('aria-label')).toBe('人力市場');
  });
});
