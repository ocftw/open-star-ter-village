import React from 'react';

export function usePolling(
  callback: () => Promise<void>,
  intervalMs: number,
  enabled = true,
): void {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      if (!cancelled) {
        await callbackRef.current();
      }
    };

    void run();
    const id = window.setInterval(() => void run(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs, enabled]);
}
