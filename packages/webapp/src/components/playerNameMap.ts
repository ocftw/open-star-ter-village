import { FilteredMetadata, PlayerID } from "boardgame.io";

/** Fallback names for seats without lobby metadata (local/DevView sessions). */
export const playerNameMap: Record<PlayerID, string> = {
  0: 'Alice',
  1: 'Bob',
  2: 'Charlie',
  3: 'Dave',
  4: 'Eve',
  5: 'Frank',
};

/**
 * Resolve a seat's display name. Multiplayer matches use the name entered in
 * the lobby (boardgame.io match metadata); local sessions fall back to the
 * static map.
 */
export const getPlayerName = (
  matchData: FilteredMetadata | undefined,
  id: PlayerID,
): string => matchData?.[Number(id)]?.name?.trim() || playerNameMap[id] || `玩家 ${id}`;
