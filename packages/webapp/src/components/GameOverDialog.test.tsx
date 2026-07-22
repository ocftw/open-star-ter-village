/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { GameOverDialog } from './BoardGame';
import { GameContext } from '@/components/GameContextHelpers';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const playAgainMock = jest.fn();
jest.mock('@/lib/lobbyClient', () => ({
  GAME_NAME: 'OpenStarTerVillage',
  GAME_SERVER_URL: 'http://localhost:3001',
  lobbyClient: { playAgain: (...args: unknown[]) => playAgainMock(...args) },
}));

const joinRoomMock = jest.fn();
jest.mock('@/app/lobby/actions', () => ({
  joinRoom: (...args: unknown[]) => joinRoomMock(...args),
  getLobbyErrorMessage: (_e: unknown, fallback: string) => fallback,
}));

const CREDS_KEY = 'open-star-ter-village.match-credentials.room-1';

const makeContext = (overrides?: { isMultiplayer?: boolean; gameover?: unknown }) =>
  ({
    G: { table: { scoreBoard: { '0': 12, '1': 9, '2': 12 } } },
    ctx: { gameover: overrides?.gameover ?? { winners: ['0', '2'] } },
    playerID: '0',
    matchID: 'room-1',
    isMultiplayer: overrides?.isMultiplayer ?? true,
    matchData: [
      { id: 0, name: 'Alice' },
      { id: 1, name: 'Bob' },
      { id: 2, name: 'Carol' },
    ],
  }) as unknown as GameContext;

describe('GameOverDialog (#419 end-game modal)', () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockReset();
    playAgainMock.mockReset();
    joinRoomMock.mockReset();
  });

  it('shows the tie winners and the full VP ranking', () => {
    const { getByText, getAllByText } = render(
      <GameOverDialog gameContext={makeContext()} open onClose={jest.fn()} />,
    );
    expect(getByText(/平手：Alice、Carol/)).toBeTruthy();
    expect(getAllByText('12 VP')).toHaveLength(2);
    expect(getByText('9 VP')).toBeTruthy();
  });

  it('offers 再玩一次 only when this browser holds seat credentials', () => {
    const noCreds = render(<GameOverDialog gameContext={makeContext()} open onClose={jest.fn()} />);
    expect(noCreds.queryByTestId('play-again')).toBeNull();
    noCreds.unmount();

    localStorage.setItem(
      CREDS_KEY,
      JSON.stringify({ matchID: 'room-1', playerID: '0', credential: 'secret', playerName: 'Alice' }),
    );
    const withCreds = render(<GameOverDialog gameContext={makeContext()} open onClose={jest.fn()} />);
    expect(withCreds.getByTestId('play-again')).toBeTruthy();
  });

  it('再玩一次 runs playAgain → joins the next match → navigates to it', async () => {
    localStorage.setItem(
      CREDS_KEY,
      JSON.stringify({ matchID: 'room-1', playerID: '0', credential: 'secret', playerName: 'Alice' }),
    );
    playAgainMock.mockResolvedValue({ nextMatchID: 'room-2' });
    joinRoomMock.mockResolvedValue({
      matchID: 'room-2',
      playerID: '1',
      credential: 'next-secret',
      playerName: 'Alice',
    });

    const { getByTestId } = render(
      <GameOverDialog gameContext={makeContext()} open onClose={jest.fn()} />,
    );
    fireEvent.click(getByTestId('play-again'));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/game/room-2'));
    expect(playAgainMock).toHaveBeenCalledWith('OpenStarTerVillage', 'room-1', {
      playerID: '0',
      credentials: 'secret',
    });
    expect(joinRoomMock).toHaveBeenCalledWith('room-2', 'Alice');
    // Fresh credentials for the next room are persisted for re-entry.
    expect(localStorage.getItem('open-star-ter-village.match-credentials.room-2')).toContain('next-secret');
  });

  it('a failed rematch shows the error and stays on the result', async () => {
    localStorage.setItem(
      CREDS_KEY,
      JSON.stringify({ matchID: 'room-1', playerID: '0', credential: 'secret', playerName: 'Alice' }),
    );
    playAgainMock.mockRejectedValue(new Error('boom'));

    const { getByTestId, getByRole } = render(
      <GameOverDialog gameContext={makeContext()} open onClose={jest.fn()} />,
    );
    fireEvent.click(getByTestId('play-again'));
    await waitFor(() => expect(getByRole('alert')).toBeTruthy());
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('closing keeps access to the final board via onClose', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <GameOverDialog gameContext={makeContext()} open onClose={onClose} />,
    );
    fireEvent.click(getByText(/關閉，查看最終盤面/));
    expect(onClose).toHaveBeenCalled();
  });
});
