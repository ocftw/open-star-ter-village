/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { GameOverDialog } from './BoardGame';
import type { GameContext } from '@/components/GameContextHelpers';
import { declineRematch, fetchEndGameUnsaved } from '@/lib/matchPersistence';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));
jest.mock('@/lib/lobbyClient', () => ({
  GAME_NAME: 'OpenStarTerVillage',
  GAME_SERVER_URL: 'http://localhost:3001',
  lobbyClient: { playAgain: jest.fn() },
}));
jest.mock('@/app/lobby/actions', () => ({
  hasPlayerName: (player: { name?: string }) => Boolean(player.name),
  hasHostStarted: () => false,
  joinRoom: jest.fn(),
  getMatch: jest.fn().mockResolvedValue({ players: [] }),
  getLobbyErrorMessage: (_e: unknown, fallback: string) => fallback,
}));
jest.mock('@/lib/matchPersistence', () => ({
  fetchEndGameUnsaved: jest.fn(),
  declineRematch: jest.fn().mockResolvedValue(undefined),
}));

const ZH = '對局結果未能儲存。遊戲已結束，但這次紀錄可能無法在伺服器重啟後恢復。';
const EN = 'The end-game result could not be saved. The game has ended, but this record may not survive a server restart.';

const context = (opts: { playerID?: string | null; gameover?: unknown; isMultiplayer?: boolean } = {}) =>
  ({
    G: { table: { scoreBoard: { '0': 12, '1': 9 } } },
    ctx: { gameover: 'gameover' in opts ? opts.gameover : { winners: ['0'] } },
    playerID: opts.playerID === undefined ? '0' : opts.playerID,
    matchID: 'room-1',
    isMultiplayer: opts.isMultiplayer ?? true,
    matchData: [{ id: 0, name: 'Alice' }, { id: 1, name: 'Bob' }],
  }) as unknown as GameContext;

const unsaved = jest.mocked(fetchEndGameUnsaved);

beforeEach(() => {
  jest.useFakeTimers();
  unsaved.mockReset();
  pushMock.mockReset();
  localStorage.clear();
  localStorage.setItem('open-star-ter-village.match-credentials.room-1', JSON.stringify({
    matchID: 'room-1', playerID: '0', credential: 'secret', playerName: 'Alice',
  }));
});
afterEach(() => jest.useRealTimers());

describe('end-game persist warning (DB-C9)', () => {
  it('shows the exact strings above the trophy and title, as an alert', async () => {
    unsaved.mockResolvedValue(true);
    const view = render(<GameOverDialog gameContext={context()} open onClose={jest.fn()} />);
    const warning = await waitFor(() => view.getByTestId('endgame-persist-warning'));
    expect(warning.getAttribute('role')).toBe('alert');
    expect(warning.textContent).toContain('⚠');
    expect(warning.textContent).toContain(ZH);
    expect(warning.textContent).toContain(EN);
    expect(warning.textContent!.indexOf(ZH)).toBeLessThan(warning.textContent!.indexOf(EN));
    // Above the trophy and the 遊戲結束 title.
    const title = view.getByRole('heading', { name: '遊戲結束' });
    expect(warning.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(warning.compareDocumentPosition(view.getByText('🏆')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(warning.style.border).toContain('var(--orange)');
    expect(unsaved).toHaveBeenCalledWith('room-1');
  });

  it('also shows for observers, keeps every button working, and clears after a successful retry', async () => {
    unsaved.mockResolvedValue(true);
    localStorage.clear();
    const onClose = jest.fn();
    const view = render(<GameOverDialog gameContext={context({ playerID: null })} open onClose={onClose} />);
    await waitFor(() => view.getByTestId('endgame-persist-warning'));
    expect(view.getByTestId('observer-watch')).toBeTruthy();

    unsaved.mockResolvedValue(false);
    await act(async () => { jest.advanceTimersByTime(3_000); });
    await waitFor(() => expect(view.queryByTestId('endgame-persist-warning')).toBeNull());

    fireEvent.click(view.getByText(/關閉，查看最終盤面/));
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(view.getByRole('button', { name: /回大廳/ }));
    expect(pushMock).toHaveBeenCalledWith('/lobby');
  });

  it('re-shows on a reconnect (remount) while the result is still unsaved', async () => {
    unsaved.mockResolvedValue(true);
    const first = render(<GameOverDialog gameContext={context()} open onClose={jest.fn()} />);
    await waitFor(() => first.getByTestId('endgame-persist-warning'));
    expect(first.getByTestId('play-again')).toBeTruthy();
    first.unmount();
    const second = render(<GameOverDialog gameContext={context()} open onClose={jest.fn()} />);
    await waitFor(() => second.getByTestId('endgame-persist-warning'));
  });

  it('never shows mid-game, offline, or when the server reports the result saved (guest tables report saved)', async () => {
    unsaved.mockResolvedValue(false);
    const saved = render(<GameOverDialog gameContext={context()} open onClose={jest.fn()} />);
    await act(async () => { jest.advanceTimersByTime(3_000); });
    expect(saved.queryByTestId('endgame-persist-warning')).toBeNull();
    saved.unmount();

    unsaved.mockClear();
    unsaved.mockResolvedValue(true);
    const midGame = render(<GameOverDialog gameContext={context({ gameover: undefined })} open onClose={jest.fn()} />);
    await act(async () => { jest.advanceTimersByTime(3_000); });
    expect(midGame.queryByTestId('endgame-persist-warning')).toBeNull();
    expect(unsaved).not.toHaveBeenCalled();
    midGame.unmount();

    const offline = render(<GameOverDialog gameContext={context({ isMultiplayer: false })} open onClose={jest.fn()} />);
    await act(async () => { jest.advanceTimersByTime(3_000); });
    expect(offline.queryByTestId('endgame-persist-warning')).toBeNull();
    expect(unsaved).not.toHaveBeenCalled();
  });

  it('the original host leaving for the lobby declines the rematch (DB-P4)', async () => {
    unsaved.mockResolvedValue(false);
    const view = render(<GameOverDialog gameContext={context()} open onClose={jest.fn()} />);
    await waitFor(() => view.getByTestId('play-again'));
    fireEvent.click(view.getByRole('button', { name: /回大廳/ }));
    expect(declineRematch).toHaveBeenCalledWith('room-1', '0', 'secret');
    expect(pushMock).toHaveBeenCalledWith('/lobby');
  });
});
