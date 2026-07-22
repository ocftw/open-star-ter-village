/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import MatchRow, { getMatchRowAction } from './MatchRow';
import type { LobbyStatus, VisibleMatch } from '@/app/lobby/actions';

const match = { matchID: 'room-1', createdAt: 1700000000000, updatedAt: 1700000000000 } as VisibleMatch['match'];

const renderRow = (status: LobbyStatus, hasSeat: boolean) => {
  const onJoin = jest.fn();
  const onReturn = jest.fn();
  const onSpectate = jest.fn();
  const utils = render(
    <MatchRow
      match={match}
      seatsFilled={3}
      totalSeats={3}
      status={status}
      hasSeat={hasSeat}
      joining={false}
      busy={false}
      onJoin={onJoin}
      onReturn={onReturn}
      onSpectate={onSpectate}
    />,
  );
  return { ...utils, onJoin, onReturn, onSpectate };
};

describe('getMatchRowAction (#421)', () => {
  it.each([
    ['In Progress', true, 'return'],
    ['Waiting', true, 'return'],
    ['Full', true, 'return'],
    ['In Progress', false, 'spectate'],
    ['Waiting', false, 'join'],
    ['Full', false, 'join'],
  ] as const)('%s + hasSeat=%s → %s', (status, hasSeat, expected) => {
    expect(getMatchRowAction(status, hasSeat)).toBe(expected);
  });
});

describe('MatchRow actions', () => {
  it('回到桌子 for the room this browser holds a seat in', () => {
    const { getByTestId, queryByTestId, onReturn } = renderRow('In Progress', true);
    fireEvent.click(getByTestId('match-return'));
    expect(onReturn).toHaveBeenCalled();
    expect(queryByTestId('match-join')).toBeNull();
    expect(queryByTestId('match-spectate')).toBeNull();
  });

  it('觀戰 for other in-progress rooms', () => {
    const { getByTestId, queryByTestId, onSpectate } = renderRow('In Progress', false);
    fireEvent.click(getByTestId('match-spectate'));
    expect(onSpectate).toHaveBeenCalled();
    expect(queryByTestId('match-return')).toBeNull();
  });

  it('加入 stays for waiting rooms and is disabled for full ones', () => {
    const waiting = renderRow('Waiting', false);
    fireEvent.click(waiting.getByTestId('match-join'));
    expect(waiting.onJoin).toHaveBeenCalled();
    waiting.unmount();

    const full = renderRow('Full', false);
    expect((full.getByTestId('match-join') as HTMLButtonElement).disabled).toBe(true);
  });
});
