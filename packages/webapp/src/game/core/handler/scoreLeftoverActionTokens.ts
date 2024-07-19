import { PlayersSelector } from "@/game/store/slice/players";
import { GameHookHandler } from "../type";
import { RuleSelector } from "@/game/store/slice/rule";
import { ScoreBoardMutator } from "@/game/store/slice/scoreBoard";

export const scoreLeftoverActionTokens: GameHookHandler = ({ G, ctx }) => {
  console.log('score leftover action tokens');
  const victoryPointsPerActionToken = RuleSelector.getSettlementLeftoverActionTokensVictoryPoints(G.rules);
  if (victoryPointsPerActionToken <= 0) {
    console.log('no victory points for leftover action tokens');
    return;
  }

  const currentPlayer = ctx.currentPlayer;
  const leftoverActionTokens = PlayersSelector.getNumActionTokens(G.players, currentPlayer);
  const victoryPoints = leftoverActionTokens * victoryPointsPerActionToken;
  ScoreBoardMutator.add(G.table.scoreBoard, currentPlayer, victoryPoints);
  console.log('end score leftover action tokens');
}
