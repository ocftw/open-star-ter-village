import { GameHookHandler } from "@/game/core/type";
import { ProjectBoardSelector } from "@/game/store/slice/projectBoard";
import { ProjectSlotSelector } from "@/game/store/slice/projectSlot/projectSlot";
import { ScoreBoardMutator } from "@/game/store/slice/scoreBoard";

/**
 * Scores VP from unfinished projects at game end.
 * Rule: every 2 contribution points a player has on unfinished projects = 1 VP; remainder discarded.
 */
export const scoreUnfinishedProjects: GameHookHandler = ({ G }) => {
  const unfinishedSlots = ProjectBoardSelector.getUnfinished(G.table.projectBoard);
  if (unfinishedSlots.length === 0) return;

  // Accumulate each player's total contribution points across all unfinished projects
  const pointsByPlayer: Record<string, number> = {};
  for (const slot of unfinishedSlots) {
    const contributors = ProjectSlotSelector.getContributors(slot);
    for (const playerId of contributors) {
      const pts = ProjectSlotSelector.getPlayerContribution(slot, playerId);
      pointsByPlayer[playerId] = (pointsByPlayer[playerId] ?? 0) + pts;
    }
  }

  // 2 contribution points = 1 VP, remainder discarded
  for (const [playerId, totalPts] of Object.entries(pointsByPlayer)) {
    const vp = Math.floor(totalPts / 2);
    if (vp > 0) {
      ScoreBoardMutator.add(G.table.scoreBoard, playerId, vp);
    }
  }
};
