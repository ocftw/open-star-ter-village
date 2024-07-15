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
  const fulfilledProjectSlots = ProjectBoardSelector.getRequirementFulfilled(G.table.projectBoard);

  if (fulfilledProjectSlots.length === 0) {
    console.log('no fulfilled projects, end stage early')
    events.endStage();
    return;
  }
  fulfilledProjectSlots.forEach(projectSlot => {
    const contributors = ProjectSlotSelector.getContributors(projectSlot);

    contributors.forEach(contributor => {
      // score points
      const victoryPoints = ProjectSlotSelector.getPlayerContribution(projectSlot, contributor);
      ScoreBoardMutator.add(G.table.scoreBoard, contributor, victoryPoints);

      // return worker tokens
      const workerTokens = ProjectSlotSelector.getPlayerWorkerTokens(projectSlot, contributor);
      ProjectSlotMutator.removeContributor(projectSlot, contributor);
      PlayersMutator.addWorkerTokens(G.players, contributor, workerTokens);
    });

    // score bonus points
    // last contributor bonus
    const lastContributorBonusPoints = RuleSelector.getSettlementLastContributorVictoryPoints(G.rules);
    ScoreBoardMutator.add(G.table.scoreBoard, projectSlot.lastContributor!, lastContributorBonusPoints);

    // owner bonus
    const ownerBonusPoints = RuleSelector.getSettlementProjectOwnerVictoryPoints(G.rules);
    const { owner, numWorkerToken } = ProjectSlotSelector.getOwner(projectSlot);
    ScoreBoardMutator.add(G.table.scoreBoard, owner, ownerBonusPoints);
    // return owner token
    PlayersMutator.addWorkerTokens(G.players, owner, numWorkerToken);
    ProjectSlotMutator.unassignOwner(projectSlot);
  });
  // Remove from table
  ProjectBoardMutator.remove(G.table.projectBoard, fulfilledProjectSlots);

  if (RuleSelector.isStandardRule(G.rules)) {
    // Update OpenSourceTree in standard version
    // TODO: implement OpenSourceTree
  } else {
    // Discard Project Card in simple version
    const projectCards = fulfilledProjectSlots.map(project => project.card);
    DeckMutator.discard(G.decks.projects, projectCards);
  }

  console.log('end settle projects')

  console.log('end stage')
  events.endStage();
})
