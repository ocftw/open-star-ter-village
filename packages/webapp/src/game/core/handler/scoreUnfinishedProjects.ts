import { GameHookHandler } from "@/game/core/type";
import { ProjectBoardSelector } from "@/game/store/slice/projectBoard";
import { ProjectSlotSelector } from "@/game/store/slice/projectSlot/projectSlot";
import { ScoreBoardMutator } from "@/game/store/slice/scoreBoard";

/**
 * Scores VP from unfinished projects at game end.
 * Floor each player's contribution / 2 separately on each unfinished project.
 */
export const scoreUnfinishedProjects: GameHookHandler = ({ G }) => {
  const unfinishedSlots = ProjectBoardSelector.getUnfinished(G.table.projectBoard);
  if (unfinishedSlots.length === 0) return;

  // Remainders cannot transfer between projects.
  const pointsByPlayer: Record<string, number> = {};
  for (const slot of unfinishedSlots) {
    const contributors = ProjectSlotSelector.getContributors(slot);
    for (const playerId of contributors) {
      const pts = ProjectSlotSelector.getPlayerContribution(slot, playerId);
      pointsByPlayer[playerId] = (pointsByPlayer[playerId] ?? 0) + Math.floor(pts / 2);
    }
  }

  for (const [playerId, vp] of Object.entries(pointsByPlayer)) {
    if (vp > 0) {
      ScoreBoardMutator.add(G.table.scoreBoard, playerId, vp);
    }
  }
};
