import { GameMove } from "@/game/core/type";
import { DeckMutator } from "@/game/store/slice/deck";
import { PlayersMutator } from "@/game/store/slice/players";
import { ProjectBoardMutator, ProjectBoardSelector } from "@/game/store/slice/projectBoard";
import { ProjectSlotMutator, ProjectSlotSelector } from "@/game/store/slice/projectSlot/projectSlot";
import { ScoreBoardMutator } from "@/game/store/slice/scoreBoard";

export type SettleProjects = () => void;
export const settleProjects: GameMove<SettleProjects> = (({ G }) => {
  const activeProjects = G.table.projectBoard;
  const fulfilledProjects = ProjectBoardSelector.filterFulfilled(activeProjects);
  if (fulfilledProjects.length === 0) {
    return;
  }
  fulfilledProjects.forEach(project => {
    const contributors = ProjectSlotSelector.getContributors(project);

    contributors.forEach(contributor => {
      // score points
      const victoryPoints = ProjectSlotSelector.getPlayerContribution(project, contributor);
      ScoreBoardMutator.add(G.table.scoreBoard, contributor, victoryPoints);

      // return worker tokens
      const workerTokens = ProjectSlotSelector.getPlayerWorkerTokens(project, contributor);
      ProjectSlotMutator.removeContributor(project, contributor);
      PlayersMutator.addWorkerTokens(G.players, contributor, workerTokens);
    });

    // score bonus points
    // last contributor bonus
    const lastContributorBonusPoints = 2;
    const lastContributor = project.lastContributor;
    ScoreBoardMutator.add(G.table.scoreBoard, lastContributor!, lastContributorBonusPoints);

    // owner bonus
    const ownerBonusPoints = 2;
    const { owner, numWorkerToken } = ProjectSlotSelector.getOwner(project);
    ScoreBoardMutator.add(G.table.scoreBoard, owner, ownerBonusPoints);
    // return owner token
    PlayersMutator.addWorkerTokens(G.players, owner, numWorkerToken);
    ProjectSlotMutator.unassignOwner(project);
  });
  // Remove from table
  ProjectBoardMutator.remove(activeProjects, fulfilledProjects);

  const version: 'simple' | 'full' = 'simple';
  if (version === 'simple') {
    // Discard Project Card in simple version
    const projectCards = fulfilledProjects.map(project => project.card);
    DeckMutator.discard(G.decks.projects, projectCards);
  } else if (version === 'full') {
    // Update OpenSourceTree in full version
    // TODO: implement OpenSourceTree
  }
})
