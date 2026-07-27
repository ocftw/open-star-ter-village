'use client';

import React from 'react';

const HINTS_STORAGE_KEY = 'open-star-ter-village.hints';

/**
 * Operation-hint visibility (design: GpHeader ⓘ toggle). On by default for
 * new players; the choice persists per browser.
 */
export function useHints(): [boolean, () => void] {
  const [hintsOn, setHintsOn] = React.useState(true);

  React.useEffect(() => {
    if (localStorage.getItem(HINTS_STORAGE_KEY) === 'off') {
      setHintsOn(false);
    }
  }, []);

  // The write stays outside the state updater: React requires updaters to be
  // pure and re-invokes them under StrictMode and render restarts.
  const toggleHints = React.useCallback(() => {
    const next = !hintsOn;
    localStorage.setItem(HINTS_STORAGE_KEY, next ? 'on' : 'off');
    setHintsOn(next);
  }, [hintsOn]);

  return [hintsOn, toggleHints];
}
