import { GameHookHandler } from "@/game/core/type";
import { ProjectBoardSelector } from "@/game/store/slice/projectBoard";
import { ProjectSlotSelector } from "@/game/store/slice/projectSlot/projectSlot";
import { publicProjects, scoreWithHistory } from '@/game/standard/history';

/**
 * Scores VP from unfinished projects at game end.
 * Floor each player's contribution / 2 separately on each unfinished project.
 */
export const scoreUnfinishedProjects: GameHookHandler = ({ G }) => {
  const unfinishedSlots = ProjectBoardSelector.getUnfinished(G.table.projectBoard);
  if (unfinishedSlots.length === 0) return;

  const snapshots = publicProjects(G);
  for (const slot of unfinishedSlots) {
    const contributors = ProjectSlotSelector.getContributors(slot);
    for (const playerId of contributors) {
      const pts = ProjectSlotSelector.getPlayerContribution(slot, playerId);
      scoreWithHistory(G, playerId, Math.floor(pts / 2), '未結案專案貢獻折半', snapshots.find(project => project.id === slot.card!.id));
    }
  }

};
