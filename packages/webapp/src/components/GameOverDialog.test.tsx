/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
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
const getMatchMock = jest.fn();
jest.mock('@/app/lobby/actions', () => ({
  joinRoom: (...args: unknown[]) => joinRoomMock(...args),
  getMatch: (...args: unknown[]) => getMatchMock(...args),
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
    getMatchMock.mockReset();
    getMatchMock.mockResolvedValue({ players: [] });
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

  it('offers the project catalog after the game in a new tab', () => {
    const { getByTestId } = render(
      <GameOverDialog gameContext={makeContext()} open onClose={jest.fn()} />,
    );
    const link = getByTestId('project-catalog-game_over');

    expect(link.getAttribute('href')).toBe(
      'https://openstartervillage.ocf.tw/cards',
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});


describe('rematch invitation (#459)', () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockReset();
    playAgainMock.mockReset();
    joinRoomMock.mockReset();
    getMatchMock.mockReset();
    localStorage.setItem(CREDS_KEY, JSON.stringify({matchID:'room-1', playerID:'0', credential:'secret', playerName:'Alice'}));
    getMatchMock.mockResolvedValue({nextMatchID:'room-2', players:[]});
  });

  it('notifies a player who closed the results, and recovers after refresh', async () => {
    const first = render(<GameOverDialog gameContext={makeContext()} open={false} onClose={jest.fn()} />);
    await waitFor(() => expect(first.getByTestId('rematch-invitation')).toBeTruthy());
    expect(first.getByTestId('play-again').textContent).toContain('加入下一局');
    first.unmount();
    const refreshed = render(<GameOverDialog gameContext={makeContext()} open={false} onClose={jest.fn()} />);
    await waitFor(() => expect(refreshed.getByTestId('rematch-invitation')).toBeTruthy());
  });

  it('dismisses the invitation without navigating or reopening for the same next match', async () => {
    jest.useFakeTimers();
    try {
      const onClose = jest.fn();
      const view = render(<GameOverDialog gameContext={makeContext()} open={false} onClose={onClose} />);
      await act(async () => {});
      fireEvent.click(view.getByText(/關閉，查看最終盤面/));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(view.queryByTestId('rematch-invitation')).toBeNull();
      await act(async () => { jest.advanceTimersByTime(3000); });
      expect(view.queryByTestId('rematch-invitation')).toBeNull();
      expect(pushMock).not.toHaveBeenCalled();
      expect(joinRoomMock).not.toHaveBeenCalled();
    } finally { jest.useRealTimers(); }
  });

  it('joins the shared next game from the invitation', async () => {
    playAgainMock.mockResolvedValue({nextMatchID:'room-2'});
    joinRoomMock.mockResolvedValue({matchID:'room-2',playerID:'1',credential:'new-secret',playerName:'Alice'});
    const view = render(<GameOverDialog gameContext={makeContext()} open={false} onClose={jest.fn()} />);
    await waitFor(() => expect(view.getByTestId('rematch-invitation')).toBeTruthy());
    fireEvent.click(view.getByTestId('play-again'));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/game/room-2'));
    expect(joinRoomMock).toHaveBeenCalledWith('room-2','Alice');
  });

  it('returns to an already joined next room without claiming another seat', async () => {
    localStorage.setItem('open-star-ter-village.match-credentials.room-2', JSON.stringify({matchID:'room-2',playerID:'1',credential:'new-secret',playerName:'Alice'}));
    playAgainMock.mockResolvedValue({nextMatchID:'room-2'});
    getMatchMock.mockImplementation(async id => id === 'room-1' ? {nextMatchID:'room-2',players:[]} : {players:[{id:1,name:'Alice'}]});
    const view = render(<GameOverDialog gameContext={makeContext()} open={false} onClose={jest.fn()} />);
    await waitFor(() => expect(view.getByTestId('rematch-invitation')).toBeTruthy());
    fireEvent.click(view.getByTestId('play-again'));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/game/room-2'));
    expect(joinRoomMock).not.toHaveBeenCalled();
  });
});
