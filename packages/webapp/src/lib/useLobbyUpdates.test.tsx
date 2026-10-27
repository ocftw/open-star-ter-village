/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { useLobbyUpdates } from './useLobbyUpdates';

class MockEventSource {
  static OPEN = 1;
  static instances: MockEventSource[] = [];
  readyState = 0;
  onmessage: (() => void) | null = null;
  close = jest.fn();
  constructor(public url: string) { MockEventSource.instances.push(this); }
}

beforeEach(() => {
  jest.useFakeTimers();
  MockEventSource.instances = [];
  Object.defineProperty(globalThis, 'EventSource', { configurable: true, value: MockEventSource });
});
afterEach(() => jest.useRealTimers());

test('refreshes from live invalidations and reconnects; polls only while unavailable', async () => {
  const refresh = jest.fn(async () => undefined);
  const { unmount } = renderHook(() => useLobbyUpdates(refresh));
  const source = MockEventSource.instances[0];
  expect(source.url).toMatch(/\/lobby\/updates$/);
  source.readyState = MockEventSource.OPEN;
  await act(async () => source.onmessage!());
  expect(refresh).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(10_000));
  expect(refresh).toHaveBeenCalledTimes(1);

  source.readyState = 0;
  await act(async () => jest.advanceTimersByTime(10_000));
  expect(refresh).toHaveBeenCalledTimes(2);
  source.readyState = MockEventSource.OPEN;
  await act(async () => source.onmessage!());
  expect(refresh).toHaveBeenCalledTimes(3);
  unmount();
  expect(source.close).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(10_000));
  expect(refresh).toHaveBeenCalledTimes(3);
});

test('coalesces changes arriving during a fetch and refreshes with the latest callback', async () => {
  let finish!: () => void;
  const refresh = jest.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  const latest = jest.fn(async () => undefined);
  const { rerender } = renderHook(({ callback }) => useLobbyUpdates(callback), { initialProps: { callback: refresh } });
  const source = MockEventSource.instances[0];
  act(() => { source.onmessage!(); source.onmessage!(); source.onmessage!(); });
  expect(refresh).toHaveBeenCalledTimes(1);
  rerender({ callback: latest });
  await act(async () => finish());
  expect(latest).toHaveBeenCalledTimes(1);
});

test('polls in browsers without EventSource', async () => {
  Object.defineProperty(globalThis, 'EventSource', { configurable: true, value: undefined });
  const refresh = jest.fn(async () => undefined);
  renderHook(() => useLobbyUpdates(refresh));
  await act(async () => jest.advanceTimersByTime(10_000));
  expect(refresh).toHaveBeenCalledTimes(1);
});
