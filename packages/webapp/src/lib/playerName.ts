/** The lobby's remembered display name, shared with the post-game 加入遊戲 join. */
export const PLAYER_NAME_STORAGE_KEY = 'open-star-ter-village.player-name';

export function isValidPlayerName(value: string): boolean {
  const trimmedValue = value.trim();
  return trimmedValue.length >= 1 && trimmedValue.length <= 20;
}
