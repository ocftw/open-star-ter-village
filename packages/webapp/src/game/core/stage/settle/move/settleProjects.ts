import { GameMove } from "@/game/core/type";
import { DeckMutator } from "@/game/store/slice/deck";
import { PlayersMutator } from "@/game/store/slice/players";
import { ProjectBoardMutator, ProjectBoardSelector } from "@/game/store/slice/projectBoard";
import { ProjectSlotMutator, ProjectSlotSelector } from "@/game/store/slice/projectSlot/projectSlot";
import { RuleSelector } from "@/game/store/slice/rule";
import { ScoreBoardMutator } from "@/game/store/slice/scoreBoard";

export type SettleProjects = () => void;
export const settleProjects: GameMove<SettleProjects> = (({ G, events }) => {
  console.log('settle projects')
  const fulfilledProjects = ProjectBoardSelector.filterFulfilled(G.table.projectBoard);

  if (fulfilledProjects.length === 0) {
    console.log('no fulfilled projects, end stage early')
    events.endStage();
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
    const lastContributorBonusPoints = RuleSelector.getSettlementLastContributorVictoryPoints(G.rules);
    ScoreBoardMutator.add(G.table.scoreBoard, project.lastContributor!, lastContributorBonusPoints);

    // owner bonus
    const ownerBonusPoints = RuleSelector.getSettlementProjectOwnerVictoryPoints(G.rules);
    const { owner, numWorkerToken } = ProjectSlotSelector.getOwner(project);
    ScoreBoardMutator.add(G.table.scoreBoard, owner, ownerBonusPoints);
    // return owner token
    PlayersMutator.addWorkerTokens(G.players, owner, numWorkerToken);
    ProjectSlotMutator.unassignOwner(project);
  });
  // Remove from table
  ProjectBoardMutator.remove(G.table.projectBoard, fulfilledProjects);

  if (RuleSelector.isStandardRule(G.rules)) {
    // Update OpenSourceTree in standard version
    // TODO: implement OpenSourceTree
  } else {
    // Discard Project Card in simple version
    const projectCards = fulfilledProjects.map(project => project.card);
    DeckMutator.discard(G.decks.projects, projectCards);
  }

  console.log('end settle projects')

  console.log('end stage')
  events.endStage();
})
