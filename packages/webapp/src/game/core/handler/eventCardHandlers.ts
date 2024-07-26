import { RuleMutator } from "@/game/store/slice/rule";
import { GameHookHandler } from "../type"
import { ScoreBoardSelector } from "@/game/store/slice/scoreBoard";

type EventCardHandler = {
  start: GameHookHandler;
  end?: GameHookHandler;
}

const endGameAfterThisRound: EventCardHandler = {
  start: ({ G }) => {
    // Leftover action tokens are converted to 1 victory points
    RuleMutator.setSettlementLastContributorVictoryPoints(G.rules, 1);
  },
  end: ({ G, events }) => {
    RuleMutator.setSettlementLastContributorVictoryPoints(G.rules, 0);
    events.endGame({ winner: ScoreBoardSelector.getWinner(G.table.scoreBoard) });
  },
}

export const eventCardHandlers: Record<string, EventCardHandler> = {
  end_game_after_this_round: endGameAfterThisRound,
};
