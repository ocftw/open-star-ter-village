/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render } from '@testing-library/react';
import type { GameContext } from '@/components/GameContextHelpers';
import { MOVE_PENDING_TIMEOUT_MS, MovePendingIndicator, SERVER_ONLY_MOVES, useMovePending } from './useMovePending';

function Harness({ context, onMoves }: { context: GameContext; onMoves: (moves: GameContext['moves']) => void }) {
  const { gameContext, movePending } = useMovePending(context);
  onMoves(gameContext.moves);
  return <MovePendingIndicator visible={movePending} />;
}

const makeContext = (moves: GameContext['moves'], G: object = {}, ctx: object = {}) =>
  ({ G, ctx, moves }) as unknown as GameContext;

describe('pending visual for hidden-info moves (DB-C5-H)', () => {
  it('lists exactly the client: false moves', () => {
    expect(Array.from(SERVER_ONLY_MOVES).sort()).toEqual(
      ['createProject', 'discardExcessJobCards', 'endActionTurn', 'recruit', 'removeAndRefillJobs'],
    );
  });

  it('shows immediately after a hidden move is sent and clears on the server broadcast', () => {
    const recruit = jest.fn();
    let moves: GameContext['moves'] = {};
    const view = render(<Harness context={makeContext({ recruit })} onMoves={(m) => { moves = m; }} />);
    expect(view.queryByTestId('move-pending')).toBeNull();

    act(() => moves.recruit('job', 'slot'));
    expect(recruit).toHaveBeenCalledWith('job', 'slot');
    expect(view.getByTestId('move-pending').getAttribute('role')).toBe('status');
    expect(view.getByTestId('move-pending').textContent).toContain('等待伺服器回應');

    // Authoritative update: new G from the server.
    view.rerender(<Harness context={makeContext({ recruit }, { next: true })} onMoves={(m) => { moves = m; }} />);
    expect(view.queryByTestId('move-pending')).toBeNull();
  });

  it('does not show for predicted public moves', () => {
    const contributeOwnedProjects = jest.fn();
    let moves: GameContext['moves'] = {};
    const view = render(<Harness context={makeContext({ contributeOwnedProjects })} onMoves={(m) => { moves = m; }} />);
    act(() => moves.contributeOwnedProjects([]));
    expect(contributeOwnedProjects).toHaveBeenCalled();
    expect(view.queryByTestId('move-pending')).toBeNull();
  });

  it('times out if the server rejects without a new state', () => {
    jest.useFakeTimers();
    const endActionTurn = jest.fn();
    let moves: GameContext['moves'] = {};
    const view = render(<Harness context={makeContext({ endActionTurn })} onMoves={(m) => { moves = m; }} />);
    act(() => moves.endActionTurn());
    expect(view.getByTestId('move-pending')).toBeTruthy();
    act(() => { jest.advanceTimersByTime(MOVE_PENDING_TIMEOUT_MS); });
    expect(view.queryByTestId('move-pending')).toBeNull();
    jest.useRealTimers();
  });
});
