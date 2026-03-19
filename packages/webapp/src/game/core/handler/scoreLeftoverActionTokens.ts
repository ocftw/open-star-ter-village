import { PlayersSelector } from "@/game/store/slice/players";
import { GameHookHandler } from "../type";
import { RuleSelector } from "@/game/store/slice/rule";
import { ScoreBoardMutator } from "@/game/store/slice/scoreBoard";

export const scoreLeftoverActionTokens: GameHookHandler = ({ G, ctx }) => {
  const victoryPointsPerActionToken = RuleSelector.getSettlementLeftoverActionTokensVictoryPoints(G.rules);
  if (victoryPointsPerActionToken <= 0) {
    return;
  }

  const currentPlayer = ctx.currentPlayer;
  const leftoverActionTokens = PlayersSelector.getNumActionTokens(G.players, currentPlayer);
  const victoryPoints = leftoverActionTokens * victoryPointsPerActionToken;
  ScoreBoardMutator.add(G.table.scoreBoard, currentPlayer, victoryPoints);
}
