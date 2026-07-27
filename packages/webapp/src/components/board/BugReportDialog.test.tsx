/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import BugReportDialog, { buildIssueUrl, buildStateSnapshot } from './BugReportDialog';
import { makeStore } from '@/lib/store';
import { GameContext } from '@/components/GameContextHelpers';

const toBlobMock = jest.fn();
jest.mock('html-to-image', () => ({
  toBlob: (...args: unknown[]) => toBlobMock(...args),
}));

const gameContext = {
  G: {
    players: {
      '0': { token: { workers: 12, actions: 3, overtime: 1 } },
      '1': { token: { workers: 11, actions: 4, overtime: 0 } },
    },
    table: {
      scoreBoard: { '0': 2, '1': 5 },
      round: 2,
      actionSlots: {
        createProject: { isOccupied: true },
        recruit: { isOccupied: false },
        contributeOwnedProjects: { isOccupied: false },
        contributeJoinedProjects: { isOccupied: false },
        removeAndRefillJobs: { isOccupied: false },
      },
    },
    rules: { numNonEndGameEventCards: 5 },
  },
  ctx: { currentPlayer: '1' },
  playerID: '0',
  matchID: 'room-9',
  matchData: undefined,
} as unknown as GameContext;

const renderDialog = (state: 'open' | 'minimized' = 'open') => {
  const onMinimize = jest.fn();
  const onRestore = jest.fn();
  const onClose = jest.fn();
  const utils = render(
    <Provider store={makeStore()}>
      <BugReportDialog
        gameContext={gameContext}
        state={state}
        onMinimize={onMinimize}
        onRestore={onRestore}
        onClose={onClose}
      />
    </Provider>,
  );
  return { ...utils, onMinimize, onRestore, onClose };
};

describe('state snapshot + issue URL', () => {
  it('captures round, players, occupied slots, seat, and UA', () => {
    const snapshot = buildStateSnapshot(gameContext, 'recruit');
    expect(snapshot).toContain('回合 Round: 2/6');
    expect(snapshot).toContain('Action in progress: recruit');
    expect(snapshot).toContain('AP: Alice 3 · Bob 4');
    expect(snapshot).toContain('VP: Alice 2 · Bob 5');
    expect(snapshot).toContain('加班 Overtime: Alice 1 · Bob 0');
    expect(snapshot).toContain('Action slots used: createProject');
    expect(snapshot).toContain('Match: room-9 · seat 0');
    expect(snapshot).toContain('UA: ');
  });

  it('prefills title from the first description line with the bug label', () => {
    const url = new URL(buildIssueUrl('招募沒反應\n第二行', 'SNAP'));
    expect(url.origin + url.pathname).toBe('https://github.com/ocftw/open-star-ter-village/issues/new');
    expect(url.searchParams.get('title')).toBe('[bug] 招募沒反應');
    expect(url.searchParams.get('labels')).toBe('bug');
    expect(url.searchParams.get('body')).toContain('SNAP');
    expect(url.searchParams.get('body')).toContain('請將截圖直接貼上');
  });

  it('falls back to a generic title when the description is empty', () => {
    const url = new URL(buildIssueUrl('', 'SNAP'));
    expect(url.searchParams.get('title')).toBe('[bug] 遊戲問題回報');
  });
});

describe('BugReportDialog', () => {
  beforeEach(() => toBlobMock.mockReset());

  it('shows the snapshot and a live issue link', () => {
    const { getByTestId } = renderDialog();
    expect(getByTestId('bug-report-snapshot').textContent).toContain('Match: room-9');
    const href = (getByTestId('bug-report-open-issue') as HTMLAnchorElement).href;
    expect(href).toContain('issues/new');
    expect(href).toContain('labels=bug');
  });

  it('minimized chip keeps the component mounted and restores on tap', () => {
    const { getByTestId, onMinimize, onRestore, rerender, queryByTestId } = renderDialog();
    fireEvent.change(getByTestId('bug-report-description'), { target: { value: 'draft text' } });
    fireEvent.click(getByTestId('bug-report-minimize'));
    expect(onMinimize).toHaveBeenCalled();

    rerender(
      <Provider store={makeStore()}>
        <BugReportDialog
          gameContext={gameContext}
          state="minimized"
          onMinimize={onMinimize}
          onRestore={onRestore}
          onClose={jest.fn()}
        />
      </Provider>,
    );
    expect(queryByTestId('bug-report-dialog')).toBeNull();
    fireEvent.click(getByTestId('bug-report-chip'));
    expect(onRestore).toHaveBeenCalled();

    rerender(
      <Provider store={makeStore()}>
        <BugReportDialog
          gameContext={gameContext}
          state="open"
          onMinimize={onMinimize}
          onRestore={onRestore}
          onClose={jest.fn()}
        />
      </Provider>,
    );
    // Same mounted component — the draft survives the minimize/restore cycle.
    expect((getByTestId('bug-report-description') as HTMLTextAreaElement).value).toBe('draft text');
  });

  it('copies a board screenshot to the clipboard when supported', async () => {
    toBlobMock.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
    const write = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { write } });
    (globalThis as Record<string, unknown>).ClipboardItem = class {
      constructor(public items: Record<string, Blob>) {}
    };

    const { getByTestId } = renderDialog();
    fireEvent.click(getByTestId('bug-report-screenshot'));
    await waitFor(() =>
      expect(getByTestId('bug-report-screenshot-status').textContent).toContain('截圖已複製'),
    );
    expect(write).toHaveBeenCalled();
  });

  it('falls back to manual-screenshot guidance when capture fails', async () => {
    toBlobMock.mockRejectedValue(new Error('no canvas'));
    const { getByTestId } = renderDialog();
    fireEvent.click(getByTestId('bug-report-screenshot'));
    await waitFor(() =>
      expect(getByTestId('bug-report-screenshot-status').textContent).toContain('無法自動複製'),
    );
  });
});
