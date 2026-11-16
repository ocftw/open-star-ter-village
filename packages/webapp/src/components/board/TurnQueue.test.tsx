/** @jest-environment jsdom */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { GameContext } from '@/components/GameContextHelpers';
import { PLAYER_COLORS } from '@/components/design';
import TurnQueue from './TurnQueue';

function context(position = 0, turn = 1): GameContext {
  return {
    G: { playOrder: ['2', '0', '1'], starterRotation: 'clockwise', players: { '0': {}, '1': {}, '2': {} } },
    ctx: { playOrderPos: position, turn },
    matchData: [{ id: 0, name: '安安' }, { id: 1, name: 'Ben' }, { id: 2, name: 'Chris' }],
  } as unknown as GameContext;
}

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn(() => ({ matches: false })) });
});

afterEach(() => jest.useRealTimers());

it('renders a named 64px current dot and six 34px upcoming turns with player colours and initials', () => {
  render(<TurnQueue gameContext={context()} />);
  expect(screen.getByRole('group', { name: '玩家順序：目前 Chris，接著 安安、Ben、安安、Ben、Chris、Ben' })).toBeTruthy();
  const current = screen.getByTestId('turn-queue-current');
  expect(current.textContent).toBe('C');
  expect(current.style.width).toBe('64px');
  const colour = document.createElement('span');
  colour.style.background = PLAYER_COLORS[2];
  expect(current.style.background).toBe(colour.style.background);
  expect(screen.getByText('Chris')).toBeTruthy();
  const upcoming = screen.getAllByTestId('turn-queue-next');
  expect(upcoming).toHaveLength(6);
  expect(upcoming.every((dot) => dot.style.width === '34px')).toBe(true);
  expect(upcoming[0].style.transform).toBe('translate(-50%, -74px)');
  expect(upcoming[1].style.transform).toBe('translate(-50%, -100px)');
});

it('lays the mobile queue out horizontally with a 34px current and 24px upcoming dots', () => {
  render(<TurnQueue gameContext={context()} horizontal />);
  expect(screen.getByTestId('turn-queue-current').style.width).toBe('34px');
  const upcoming = screen.getAllByTestId('turn-queue-next');
  expect(upcoming.every((dot) => dot.style.width === '24px')).toBe(true);
  expect(upcoming[0].style.transform).toBe('translate(42px, -50%)');
  expect(upcoming[1].style.transform).toBe('translate(60px, -50%)');
});

it('retains upcoming dot identities as they slide forward and fades the old current out', () => {
  jest.useFakeTimers();
  const { rerender } = render(<TurnQueue gameContext={context()} />);
  const next = screen.getAllByTestId('turn-queue-next')[0];
  rerender(<TurnQueue gameContext={context(1, 2)} />);
  expect(screen.getByTestId('turn-queue-current')).toBe(next);
  expect(next.style.width).toBe('64px');
  expect(next.getAttribute('title')).toBe('安安');
  expect(screen.getByTestId('turn-queue-exit').getAttribute('data-player-id')).toBe('2');
  act(() => jest.advanceTimersByTime(400));
  expect(screen.queryByTestId('turn-queue-exit')).toBeNull();
});

it('does not retain an animated exit with reduced motion', () => {
  jest.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
  const { rerender } = render(<TurnQueue gameContext={context()} />);
  rerender(<TurnQueue gameContext={context(1, 2)} />);
  expect(screen.queryByTestId('turn-queue-exit')).toBeNull();
  expect(screen.getByTestId('turn-queue-current').getAttribute('data-player-id')).toBe('0');
});
