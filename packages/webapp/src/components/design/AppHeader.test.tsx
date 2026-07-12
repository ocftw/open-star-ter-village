/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import LobbyNav from '@/components/lobby/LobbyNav';
import GameHeader from '@/components/board/GameHeader';
import { GameContext } from '@/components/GameContextHelpers';

const gameContext = {
  G: {
    players: {
      '0': { token: { workers: 12, actions: 4 } },
      '1': { token: { workers: 12, actions: 4 } },
    },
    table: { scoreBoard: { '0': 2, '1': 0 } },
  },
  ctx: { currentPlayer: '0' },
  playerID: '0',
  matchData: undefined,
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

  it('game surface exposes player chips and Leave inside the shared shell', () => {
    const { getByTestId, getByText } = render(<GameHeader gameContext={gameContext} />);
    expect(getByTestId('player-status-Alice')).toBeTruthy();
    expect(getByTestId('player-status-Bob')).toBeTruthy();
    expect(getByText('離開')).toBeTruthy();
  });

  it('compact mobile variant keeps only the star tile so chips get the width', () => {
    const compact = shellOf(<GameHeader gameContext={gameContext} compact />);
    expect(compact.hasLogoLink).toBe(true);
    expect(compact.el.textContent).not.toContain('開源星手村');
    expect(compact.style.minHeight).toBe('52px');
    expect(compact.style.background).toBe('var(--paper)');
    expect(compact.style.borderBottom).toBe('1.5px solid var(--paper-3)');
  });

  it('desktop surfaces keep the full wordmark', () => {
    const desktop = shellOf(<GameHeader gameContext={gameContext} />);
    expect(desktop.el.textContent).toContain('開源星手村');
  });
});
