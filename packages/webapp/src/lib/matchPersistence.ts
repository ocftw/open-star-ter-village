import { GAME_NAME, GAME_SERVER_URL } from '@/lib/lobbyClient';

/**
 * End-game persistence status of a match. The game server answers from its
 * own memory (a side channel, not part of G), so it never changes gameplay.
 * Errors read as "not unsaved": the warning only shows on a positive report.
 */
export async function fetchEndGameUnsaved(matchID: string): Promise<boolean> {
  const response = await fetch(`${GAME_SERVER_URL}/games/${GAME_NAME}/${encodeURIComponent(matchID)}/persistence`);
  if (!response.ok) return false;
  const body = (await response.json()) as { endGameUnsaved?: unknown };
  return body.endGameUnsaved === true;
}

/** The original host leaves the rematch: the first player to join the next room becomes host. */
export async function declineRematch(matchID: string, playerID: string, credentials: string): Promise<void> {
  await fetch(`${GAME_SERVER_URL}/games/${GAME_NAME}/${encodeURIComponent(matchID)}/declineRematch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerID, credentials }),
  });
}
