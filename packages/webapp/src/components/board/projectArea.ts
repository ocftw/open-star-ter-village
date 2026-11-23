import { PlayerID } from 'boardgame.io';
import { ProjectSlotState } from '@/game';

/** Occupied slots split by owner, in board order. Observers (null) see everything under `others`. */
export function splitProjectSlots(
  projectBoard: ProjectSlotState[],
  playerID: PlayerID | null,
): { yours: ProjectSlotState[]; others: ProjectSlotState[] } {
  const yours: ProjectSlotState[] = [];
  const others: ProjectSlotState[] = [];
  for (const slot of projectBoard) {
    if (!slot.card) continue;
    (playerID !== null && slot.owner === playerID ? yours : others).push(slot);
  }
  return { yours, others };
}

export function capacityHint(maxSlots: number): string {
  return maxSlots === 8 ? '場上最多八張專案卡' : `場上最多 ${maxSlots} 張專案卡`;
}
