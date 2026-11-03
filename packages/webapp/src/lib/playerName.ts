/** The lobby's remembered display name, shared with picking a seat in a room (#373). */
export const PLAYER_NAME_STORAGE_KEY = 'open-star-ter-village.player-name';

export function isValidPlayerName(value: string): boolean {
  const trimmedValue = value.trim();
  return trimmedValue.length >= 1 && trimmedValue.length <= 20;
}
