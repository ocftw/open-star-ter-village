import { FilteredMetadata, PlayerID } from "boardgame.io";
import { isBotSeat } from "@/game/bots/seat";

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
 * static stub map. Bot seats are marked so players can tell them apart.
 */
export const getPlayerName = (
  matchData: FilteredMetadata | undefined,
  id: PlayerID,
): string => {
  // The server sends each seat's `data` (minus credentials); boardgame.io's type omits it.
  const player = matchData?.[Number(id)] as ({ name?: string; data?: unknown } & { data?: { displayName?: unknown } }) | undefined;
  const savedName = player?.data?.displayName;
  const name = player?.name?.trim() || (typeof savedName === 'string' ? savedName.trim() : '') || stubPlayerNameMap[id] || `玩家 ${id}`;
  return player && isBotSeat(player) ? `${name} 🤖` : name;
};
