/** @jest-environment jsdom */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import GameRoomPage from './page';
import type { LobbyMatch } from '@/app/lobby/actions';

const mockGetMatch = jest.fn();
let mockPollMatch: () => Promise<void>;

jest.mock('next/navigation', () => ({
  useParams: () => ({ matchID: 'room-1' }),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/app/lobby/actions', () => ({
  ...jest.requireActual('@/app/lobby/actions'),
  getMatch: (...args: unknown[]) => mockGetMatch(...args),
}));
jest.mock('@/lib/usePolling', () => ({
  usePolling: (callback: () => Promise<void>, _interval: number, enabled: boolean) => {
    mockPollMatch = callback;
    const react = jest.requireActual<typeof React>('react');
    react.useEffect(() => {
      if (enabled) void callback();
      // The test drives subsequent authoritative metadata updates explicitly.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);
  },
}));
jest.mock('@/components/GameView', () => ({
  __esModule: true,
  default: () => <div data-testid="final-board">Final board and results</div>,
}));
jest.mock('@/components/lobby/LobbyNav', () => ({
  __esModule: true,
  default: () => <nav>Lobby</nav>,
}));

const room = (finished: boolean): LobbyMatch => ({
  matchID: 'room-1',
  gameName: 'OpenStarTerVillage',
  createdAt: 1_793_059_200_000,
  updatedAt: 1_793_059_200_000,
  players: [
    { id: 0, name: 'Alice', data: { started: true } },
    { id: 1, name: 'Bob' },
    { id: 2, name: 'Carol' },
  ],
  ...(finished ? { gameover: { winners: ['0'] } } : {}),
});

describe('finished room departures (#458)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetMatch.mockReset();
  });

  it('keeps the final board mounted when a player leaves a finished room', async () => {
    const match = room(true);
    mockGetMatch.mockResolvedValue(match);
    const view = render(<GameRoomPage />);
    await waitFor(() => expect(view.getByTestId('final-board')).toBeTruthy());

    mockGetMatch.mockResolvedValue({
      ...match,
      players: match.players.map(player => player.id === 1 ? { id: player.id } : player),
    });
    await act(() => mockPollMatch());

    expect(view.getByTestId('final-board')).toBeTruthy();
    expect(view.queryByTestId('match-terminated-overlay')).toBeNull();
  });

  it('opens the final board on refresh after the host has left', async () => {
    const match = room(true);
    match.players[0] = { id: 0, data: { started: true } };
    mockGetMatch.mockResolvedValue(match);
    const view = render(<GameRoomPage />);

    await waitFor(() => expect(view.getByTestId('final-board')).toBeTruthy());
    expect(view.queryByTestId('match-terminated-overlay')).toBeNull();
  });

  it('still terminates an unfinished room after a player leaves', async () => {
    const match = room(false);
    mockGetMatch.mockResolvedValue(match);
    const view = render(<GameRoomPage />);
    await waitFor(() => expect(view.getByTestId('final-board')).toBeTruthy());

    mockGetMatch.mockResolvedValue({
      ...match,
      players: match.players.map(player => player.id === 1 ? { id: player.id } : player),
    });
    await act(() => mockPollMatch());

    expect(view.queryByTestId('final-board')).toBeNull();
    expect(view.getByTestId('match-terminated-overlay')).toBeTruthy();
  });
});
