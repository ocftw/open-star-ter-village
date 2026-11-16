/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LobbyNav from '@/components/lobby/LobbyNav';
import GameHeader from '@/components/board/GameHeader';
import { GameContext } from '@/components/GameContextHelpers';
import events from '@/game/data/card/events.json';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const gameContext = {
  G: {
    players: {
      '0': { token: { workers: 12, actions: 4 } },
      '1': { token: { workers: 12, actions: 4 } },
    },
    table: {
      scoreBoard: { '0': 2, '1': 0 },
      round: 2,
      eventSlot: { ...events.find((card) => card.name === '四大自由')!, id: 'event-2' },
    },
  },
  ctx: { currentPlayer: '0' },
  playerID: '0',
  matchData: undefined,
  matchID: 'room-1',
} as unknown as GameContext;

const shellOf = (ui: React.ReactElement) => {
  const { getByTestId, unmount } = render(ui);
  const el = getByTestId('app-header');
  const style = {
    minHeight: el.style.minHeight,
    padding: el.style.padding,
    background: el.style.background,
    borderBottom: el.style.borderBottom,
  };
  const logoLink = el.querySelector('a[aria-label="回首頁 Home"]');
  const result = { style, hasLogoLink: !!logoLink, el };
  return { ...result, unmount };
};

describe('shared application header shell', () => {
  it('lobby and desktop game headers share the same shell values', () => {
    const lobby = shellOf(<LobbyNav />);
    const lobbyStyle = lobby.style;
    const lobbyHasLogo = lobby.hasLogoLink;
    lobby.unmount();

    const game = shellOf(<GameHeader gameContext={gameContext} />);
    expect(game.style).toEqual(lobbyStyle);
    expect(lobbyHasLogo).toBe(true);
    expect(game.hasLogoLink).toBe(true);
  });

  it('game header keeps sticky positioning without changing resting visuals', () => {
    const lobby = shellOf(<LobbyNav />);
    const lobbyStyle = lobby.style;
    lobby.unmount();

    const game = shellOf(<GameHeader gameContext={gameContext} />);
    expect(game.el.style.position).toBe('sticky');
    // Resting visual treatment (colors, divider, height) matches the lobby.
    expect(game.style).toEqual(lobbyStyle);
  });

  it('shows the round and current event with Rules and Leave, without player chips', () => {
    render(<GameHeader gameContext={gameContext} />);
    expect(screen.getByTestId('header-round').textContent).toBe('第 2 輪 · 四大自由');
    expect(screen.getByRole('button', { name: '離開 LEAVE' })).toBeTruthy();
    const rules = screen.getByRole('link', { name: '規則 RULES' });
    expect(rules.getAttribute('href')).toBe('/rules');
    expect(rules.getAttribute('target')).toBe('_blank');
    expect(screen.getByTestId('app-header').querySelector('[data-testid^="player-status-"]')).toBeNull();
  });

  it.each([false, true])('shows just the round when no event is on the table (compact=%s)', (compact) => {
    const withoutEvent = {
      ...gameContext,
      G: { ...gameContext.G, table: { ...gameContext.G.table, eventSlot: null } },
    };
    render(<GameHeader gameContext={withoutEvent} compact={compact} />);
    expect(screen.getByTestId('header-round').textContent).toBe('第 2 輪');
  });

  it('follows round updates', () => {
    const { rerender } = render(<GameHeader gameContext={gameContext} />);
    rerender(<GameHeader gameContext={{
      ...gameContext,
      G: { ...gameContext.G, table: { ...gameContext.G.table, round: 3 } },
    }} />);
    expect(screen.getByTestId('header-round').textContent).toBe('第 3 輪 · 四大自由');
  });

  it('compact mobile variant keeps the star tile and round without the wordmark or event', () => {
    const compact = shellOf(<GameHeader gameContext={gameContext} compact />);
    expect(compact.hasLogoLink).toBe(true);
    expect(compact.el.textContent).not.toContain('開源星手村');
    expect(screen.getByTestId('header-round').textContent).toBe('第 2 輪');
    expect(screen.queryByTestId('header-leave')).toBeNull();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(compact.style.minHeight).toBe('52px');
    expect(compact.style.background).toBe('var(--paper)');
    expect(compact.style.borderBottom).toBe('1.5px solid var(--paper-3)');
  });

  it('desktop surfaces keep the full wordmark', () => {
    const desktop = shellOf(<GameHeader gameContext={gameContext} />);
    expect(desktop.el.textContent).toContain('開源星手村');
  });

  it.each([false, true])('Leave opens the existing exit dialog and cancel stays in the game (compact=%s)', (compact) => {
    pushMock.mockClear();
    render(<GameHeader gameContext={gameContext} compact={compact} />);
    expect(screen.queryByTestId('exit-dialog')).toBeNull();
    if (compact) {
      const menu = screen.getByTestId('header-menu');
      fireEvent.click(menu);
      expect(menu.getAttribute('aria-expanded')).toBe('true');
      const rules = screen.getByRole('menuitem', { name: /遊戲規則/ });
      expect(rules.getAttribute('href')).toBe('/rules');
      expect(rules.getAttribute('target')).toBe('_blank');
    }
    fireEvent.click(screen.getByTestId(compact ? 'menu-leave' : 'header-leave'));
    expect(screen.getByRole('dialog', { name: '要離開嗎？' })).toBeTruthy();
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByTestId('exit-cancel'));
    expect(screen.queryByTestId('exit-dialog')).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
