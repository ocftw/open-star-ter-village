import { FilteredMetadata, PlayerID } from "boardgame.io";

/** Stub display names for seats without lobby metadata (local development sessions). */
export const stubPlayerNameMap: Record<PlayerID, string> = {
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
 * static stub map.
 */
export const getPlayerName = (
  matchData: FilteredMetadata | undefined,
  id: PlayerID,
): string => matchData?.[Number(id)]?.name?.trim() || stubPlayerNameMap[id] || `玩家 ${id}`;
