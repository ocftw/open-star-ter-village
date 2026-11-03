/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Boardgame from './BoardGame';
import StoreProvider from '@/app/StoreProvider';
import game from '@/game';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/dev',
  useSearchParams: () => new URLSearchParams(),
}));

const getMatchMock = jest.fn();
jest.mock('@/app/lobby/actions', () => ({
  ...jest.requireActual('@/app/lobby/actions'),
  getMatch: (id: string) => getMatchMock(id),
}));

// Offline dev games run on Local(), where boardgame.io still reports isMultiplayer.
it('offers no observer 繼續觀戰 and polls no lobby in an offline game (#373)', async () => {
  window.matchMedia = window.matchMedia ?? ((query: string) => ({
    matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  }) as unknown as MediaQueryList);
  const finishedGame = { ...game, endIf: () => ({ winners: ['0'] }) };
  render(
    <StoreProvider>
      <Boardgame isLocal matchID="dev-local" playerID={undefined} numPlayers={3} gameConfig={finishedGame} />
    </StoreProvider>,
  );
  await waitFor(() => expect(screen.getByText('遊戲結束', { selector: 'h2' })).toBeTruthy());
  expect(screen.queryByTestId('observer-watch')).toBeNull();
  expect(getMatchMock).not.toHaveBeenCalled();
});
