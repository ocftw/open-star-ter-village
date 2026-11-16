/** @jest-environment jsdom */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { useRoundStartOverlay } from './useRoundStartOverlay';

beforeEach(() => sessionStorage.clear());

it('shows a first mid-round visit once, including StrictMode effect replay and a simulated reload', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <React.StrictMode>{children}</React.StrictMode>;
  const first = renderHook(() => useRoundStartOverlay('fixed-match', 7, false, true), { wrapper });
  expect(first.result.current.open).toBe(true);
  expect(sessionStorage.getItem('open-star-ter-village.round-start.fixed-match.7')).toBe('seen');
  // Reload while still open also counts as seen, not only after acknowledgement.
  first.unmount();
  const reloaded = renderHook(() => useRoundStartOverlay('fixed-match', 7, false, true), { wrapper });
  expect(reloaded.result.current.open).toBe(false);
});

it('closes until the next round, keeping separate matches independent', () => {
  const { result, rerender } = renderHook(({ matchID, round }) => useRoundStartOverlay(matchID, round, false, true), {
    initialProps: { matchID: 'fixed-match', round: 1 },
  });
  expect(result.current.open).toBe(true);
  act(() => result.current.close());
  rerender({ matchID: 'fixed-match', round: 1 });
  expect(result.current.open).toBe(false);
  rerender({ matchID: 'fixed-match', round: 2 });
  expect(result.current.open).toBe(true);
  rerender({ matchID: 'another-match', round: 2 });
  expect(result.current.open).toBe(true);
  rerender({ matchID: 'fixed-match', round: 2 });
  expect(result.current.open).toBe(false);
});

it('waits for the first event without consuming the show-once key', () => {
  const { result, rerender } = renderHook(({ round, hasEvent }) => useRoundStartOverlay('fixed-match', round, false, hasEvent), {
    initialProps: { round: 0, hasEvent: false },
  });
  expect(result.current.open).toBe(false);
  rerender({ round: 1, hasEvent: false });
  expect(result.current.open).toBe(false);
  expect(sessionStorage.length).toBe(0);
  rerender({ round: 1, hasEvent: true });
  expect(result.current.open).toBe(true);
});

it('suppresses a finished match and immediately hides an open prompt on game over', () => {
  const finished = renderHook(() => useRoundStartOverlay('finished-match', 8, true, true));
  expect(finished.result.current.open).toBe(false);
  expect(sessionStorage.length).toBe(0);
  const { result, rerender } = renderHook(({ gameOver, round }) => useRoundStartOverlay('fixed-match', round, gameOver, true), {
    initialProps: { gameOver: false, round: 1 },
  });
  expect(result.current.open).toBe(true);
  rerender({ gameOver: true, round: 2 });
  expect(result.current.open).toBe(false);
  expect(sessionStorage.getItem('open-star-ter-village.round-start.fixed-match.2')).toBeNull();
});

it('still shows once across remounts if sessionStorage is unavailable', () => {
  const storage = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked'); });
  try {
    const first = renderHook(() => useRoundStartOverlay('storage-blocked-match', 1, false, true));
    expect(first.result.current.open).toBe(true);
    first.unmount();
    const remount = renderHook(() => useRoundStartOverlay('storage-blocked-match', 1, false, true));
    expect(remount.result.current.open).toBe(false);
  } finally {
    storage.mockRestore();
  }
});
