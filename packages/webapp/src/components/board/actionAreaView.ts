/**
 * Which panel fills the board's action area. Anyone not on turn — another
 * player or an observer without a seat (playerID null) — sees who the round
 * is waiting on.
 */
export type ActionAreaView = 'discard' | 'context' | 'waiting';

export const getActionAreaView = (
  playerID: string | null,
  currentPlayer: string,
  discardPending: boolean,
): ActionAreaView => {
  if (playerID !== currentPlayer) return 'waiting';
  return discardPending ? 'discard' : 'context';
};
