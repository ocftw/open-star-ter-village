import React from 'react';
import { GAME_SERVER_URL } from './lobbyClient';

/** Refresh on public lobby changes, with EventSource reconnect and polling fallback. */
export function useLobbyUpdates(callback: () => Promise<boolean | void>): void {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    let stopped = false;
    let refreshing = false;
    let queued = false;
    let lastRefreshFailed = false;
    const refresh = async () => {
      if (stopped) return;
      if (refreshing) {
        queued = true;
        return;
      }
      refreshing = true;
      do {
        queued = false;
        try {
          lastRefreshFailed = (await callbackRef.current()) === false;
        } catch {
          lastRefreshFailed = true;
        }
      } while (queued && !stopped);
      refreshing = false;
    };

    const source = typeof EventSource === 'undefined'
      ? undefined
      : new EventSource(`${GAME_SERVER_URL}/lobby/updates`);
    if (source) source.onmessage = () => void refresh();
    const fallback = window.setInterval(() => {
      if (!source || source.readyState !== EventSource.OPEN || lastRefreshFailed) void refresh();
    }, 10_000);
    return () => {
      stopped = true;
      window.clearInterval(fallback);
      source?.close();
    };
  }, []);
}
