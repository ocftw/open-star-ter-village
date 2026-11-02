/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import GameRoomPage from './page';
import type { LobbyMatch } from '@/app/lobby/actions';

const mockGetMatch = jest.fn();
const mockJoinRoom = jest.fn();
let mockPollMatch: () => Promise<void>;

jest.mock('next/navigation', () => ({
  useParams: () => ({ matchID: 'room-1' }),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/app/lobby/actions', () => ({
  ...jest.requireActual('@/app/lobby/actions'),
  getMatch: (...args: unknown[]) => mockGetMatch(...args),
  joinRoom: (...args: unknown[]) => mockJoinRoom(...args),
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

describe('seatless visitors picking an open seat (#373)', () => {
  const waitingRoom = (players: LobbyMatch['players']): LobbyMatch => ({ ...room(false), players });
  const openRoom = () => waitingRoom([{ id: 0, name: 'Alice' }, { id: 1 }, { id: 2, name: 'Carol' }]);

  beforeEach(() => {
    localStorage.clear();
    mockGetMatch.mockReset();
    mockJoinRoom.mockReset();
    localStorage.setItem('open-star-ter-village.player-name', 'Dana');
  });

  it('lets an observer sit in the open seat they pick', async () => {
    mockGetMatch.mockResolvedValue(openRoom());
    mockJoinRoom.mockResolvedValue({ matchID: 'room-1', playerID: '1', credential: 'dana-secret', playerName: 'Dana' });
    const view = render(<GameRoomPage />);
    await waitFor(() => expect(view.getByTestId('seat-1-sit')).toBeTruthy());
    expect(view.getByText(/選一個空位坐下/)).toBeTruthy();
    expect((view.getByTestId('seat-name') as HTMLInputElement).value).toBe('Dana');

    mockGetMatch.mockResolvedValueOnce(openRoom());
    mockGetMatch.mockResolvedValue(waitingRoom([{ id: 0, name: 'Alice' }, { id: 1, name: 'Dana' }, { id: 2, name: 'Carol' }]));
    fireEvent.click(view.getByTestId('seat-1-sit'));

    await waitFor(() => expect(view.getByText(/你的座位是 Seat 1/)).toBeTruthy());
    expect(mockJoinRoom).toHaveBeenCalledWith('room-1', 'Dana', '1');
    expect(localStorage.getItem('open-star-ter-village.match-credentials.room-1')).toContain('dana-secret');
    expect(view.queryByTestId('seat-name')).toBeNull();
  });

  it('never offers the host seat, and offers nothing until the host holds it', async () => {
    mockGetMatch.mockResolvedValue(waitingRoom([{ id: 0 }, { id: 1, name: 'Bob' }, { id: 2 }]));
    const view = render(<GameRoomPage />);
    await waitFor(() => expect(view.getByTestId('seat-grid')).toBeTruthy());
    expect(view.queryByTestId('seat-2-sit')).toBeNull();
    expect(view.queryByTestId('seat-0-sit')).toBeNull();
  });

  it('needs a valid name before sitting', async () => {
    localStorage.clear();
    mockGetMatch.mockResolvedValue(openRoom());
    const view = render(<GameRoomPage />);
    await waitFor(() => expect(view.getByTestId('seat-1-sit')).toBeTruthy());
    expect((view.getByTestId('seat-1-sit') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(view.getByTestId('seat-name'), { target: { value: 'Eve' } });
    expect((view.getByTestId('seat-1-sit') as HTMLButtonElement).disabled).toBe(false);
  });

  it.each([
    ['the host left', waitingRoom([{ id: 0 }, { id: 1 }, { id: 2, name: 'Carol' }])],
    ['the game started', waitingRoom([{ id: 0, name: 'Alice', data: { started: true } }, { id: 1 }, { id: 2, name: 'Carol' }])],
    ['someone took the seat', waitingRoom([{ id: 0, name: 'Alice' }, { id: 1, name: 'Bob' }, { id: 2, name: 'Carol' }])],
  ])('re-checks the room before sitting and does not join once %s', async (_label, changedRoom) => {
    mockGetMatch.mockResolvedValue(openRoom());
    const view = render(<GameRoomPage />);
    await waitFor(() => expect(view.getByTestId('seat-1-sit')).toBeTruthy());
    mockGetMatch.mockResolvedValue(changedRoom);
    const callsBeforeClick = mockGetMatch.mock.calls.length;
    fireEvent.click(view.getByTestId('seat-1-sit'));
    // One re-check before joining, then the refresh after the attempt.
    await waitFor(() => expect(mockGetMatch.mock.calls.length).toBeGreaterThanOrEqual(callsBeforeClick + 2));
    expect(mockJoinRoom).not.toHaveBeenCalled();
    expect(localStorage.getItem('open-star-ter-village.match-credentials.room-1')).toBeNull();
  });

  it('does not tell a visitor to pick a seat when every seat is taken', async () => {
    mockGetMatch.mockResolvedValue(waitingRoom([{ id: 0, name: 'Alice' }, { id: 1, name: 'Bob' }, { id: 2, name: 'Carol' }]));
    const view = render(<GameRoomPage />);
    await waitFor(() => expect(view.getByTestId('seat-grid')).toBeTruthy());
    expect(view.queryByText(/選一個空位坐下/)).toBeNull();
    expect(view.queryByTestId('seat-name')).toBeNull();
  });

  it('does not offer seats to a visitor who already holds one', async () => {
    localStorage.setItem('open-star-ter-village.match-credentials.room-1', JSON.stringify({ matchID: 'room-1', playerID: '2', credential: 'carol', playerName: 'Carol' }));
    mockGetMatch.mockResolvedValue(openRoom());
    const view = render(<GameRoomPage />);
    await waitFor(() => expect(view.getByText(/你的座位是 Seat 2/)).toBeTruthy());
    expect(view.queryByTestId('seat-1-sit')).toBeNull();
  });
});
