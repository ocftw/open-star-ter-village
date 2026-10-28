import { PlayersSelector } from "@/game/store/slice/players";
import { GameHookHandler } from "../type";
import { RuleSelector } from "@/game/store/slice/rule";
import { scoreWithHistory } from '@/game/standard/history';

export const scoreLeftoverActionTokens: GameHookHandler = ({ G, ctx }) => {
  const victoryPointsPerActionToken = RuleSelector.getSettlementLeftoverActionTokensVictoryPoints(G.rules);
  if (victoryPointsPerActionToken <= 0) {
    return;
  }

  const currentPlayer = ctx.currentPlayer;
  const leftoverActionTokens = PlayersSelector.getNumActionTokens(G.players, currentPlayer);
  const victoryPoints = leftoverActionTokens * victoryPointsPerActionToken;
  scoreWithHistory(G, currentPlayer, victoryPoints, '最終回合剩餘行動點');
}
