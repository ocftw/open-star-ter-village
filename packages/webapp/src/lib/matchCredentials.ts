'use client';

const STORAGE_KEY_PREFIX = 'open-star-ter-village.match-credentials';

export interface MatchCredentials {
  matchID: string;
  playerID: string;
  credential: string;
  playerName?: string;
}

function getStorageKey(matchID: string): string {
  return `${STORAGE_KEY_PREFIX}.${matchID}`;
}

function isMatchCredentials(value: unknown): value is MatchCredentials {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<MatchCredentials>;
  return typeof candidate.matchID === 'string'
    && typeof candidate.playerID === 'string'
    && typeof candidate.credential === 'string'
    && (candidate.playerName === undefined || typeof candidate.playerName === 'string');
}

export function saveCredentials(credentials: MatchCredentials): void {
  localStorage.setItem(getStorageKey(credentials.matchID), JSON.stringify(credentials));
}

export function loadCredentials(matchID: string): MatchCredentials | null {
  const storedValue = localStorage.getItem(getStorageKey(matchID));

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (isMatchCredentials(parsedValue) && parsedValue.matchID === matchID) {
      return parsedValue;
    }
  } catch {
    localStorage.removeItem(getStorageKey(matchID));
  }

  return null;
}

export function clearCredentials(matchID: string): void {
  localStorage.removeItem(getStorageKey(matchID));
}
