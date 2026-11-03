/**
 * Which panel fills the board's action area. Anyone not on turn — another
 * player or an observer without a seat (playerID null) — sees who the round
 * is waiting on. Once the game is over nobody is waiting: everyone gets the
 * game-over note.
 */
export type ActionAreaView = 'discard' | 'context' | 'waiting' | 'gameover';

export const getActionAreaView = (
  playerID: string | null,
  currentPlayer: string,
  { discardPending, gameOver }: { discardPending: boolean; gameOver: boolean },
): ActionAreaView => {
  if (gameOver) return 'gameover';
  if (playerID !== currentPlayer) return 'waiting';
  return discardPending ? 'discard' : 'context';
};
