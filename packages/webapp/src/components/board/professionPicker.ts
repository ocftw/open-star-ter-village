import { PlayerID } from 'boardgame.io';
import { ProjectSlotState } from '@/game';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';

/**
 * 斜槓青年 target-position picker: when a mismatched job card is
 * played under the event, the target card's requirement rows become the
 * interactive targets. Parents that hold the game state compute this and the
 * card components only render it.
 */
export interface ProfessionPicker {
  /** Required positions the player may currently choose. */
  eligibleJobNames: string[];
  selectedJobName: string | null;
  onPick: (jobName: string) => void;
}

/** Positions on an active project that are neither fulfilled nor already held by the player. */
export const getEligibleTargetJobNames = (slot: ProjectSlotState, playerID: PlayerID): string[] => {
  const card = slot.card;
  if (!card) return [];
  return Object.keys(card.requirements).filter(
    (jobName) =>
      !ProjectSlotSelector.hasWorker(slot, jobName, playerID) &&
      ProjectSlotSelector.getJobContribution(slot, jobName) < card.requirements[jobName],
  );
};
