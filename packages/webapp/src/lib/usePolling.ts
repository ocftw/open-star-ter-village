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

    const run = async (): Promise<void> => {
      if (cancelled) return;
      try {
        await callbackRef.current();
      } catch {
        // caller is responsible for error handling
      }
      if (!cancelled) {
        window.setTimeout(() => void run(), intervalMs);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [intervalMs, enabled]);
}
