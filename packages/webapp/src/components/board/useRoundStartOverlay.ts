import { useEffect, useRef, useState } from 'react';

// Storage can be unavailable in privacy-restricted browsers. Still show once
// across board remounts in that tab, without blocking play on a storage error.
const storageUnavailableSeen = new Set<string>();

export function useRoundStartOverlay(matchID: string, round: number, gameOver: boolean, hasEvent: boolean) {
  const key = `open-star-ter-village.round-start.${matchID}.${round}`;
  const eligible = round > 0 && hasEvent && !gameOver;
  const checkedKey = useRef<string | null>(null);
  const [prompt, setPrompt] = useState<{ key: string; open: boolean } | null>(null);

  useEffect(() => {
    if (!eligible || checkedKey.current === key) return;
    // Keep the first effect's decision during React StrictMode's effect replay.
    checkedKey.current = key;
    let seen = storageUnavailableSeen.has(key);
    try {
      seen = seen || sessionStorage.getItem(key) === 'seen';
      sessionStorage.setItem(key, 'seen');
    } catch {
      storageUnavailableSeen.add(key);
    }
    setPrompt({ key, open: !seen });
  }, [eligible, key]);

  return {
    open: eligible && prompt?.key === key && prompt.open,
    ready: gameOver || prompt?.key === key,
    close: () => setPrompt((current) => current && { ...current, open: false }),
  };
}
