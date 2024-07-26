import { GameHookHandler } from "@/game/core/type";
import { ActionSlotsMutator } from "@/game/store/slice/actionSlots";
import { DeckMutator, DeckSelector } from "@/game/store/slice/deck";
import { PlayersMutator, PlayersSelector } from "@/game/store/slice/players";
import { RuleSelector } from "@/game/store/slice/rule";

export const refill: GameHookHandler = ({ G, ctx }) => {
  console.log('refill stage')
  // refill project cards
  const maxProjectCards = RuleSelector.getPlayerMaxProjectCards(G.rules);
  const numProjectsInHand = PlayersSelector.getNumProjects(G.players, ctx.currentPlayer);
  const refillCardNumber = maxProjectCards - numProjectsInHand;
  const projectCards = DeckSelector.peek(G.decks.projects, refillCardNumber);
  DeckMutator.draw(G.decks.projects, refillCardNumber);
  PlayersMutator.addProjects(G.players, ctx.currentPlayer, projectCards);

  // refill action points
  const numActionTokens = RuleSelector.getPlayerMaxActionTokens(G.rules);
  PlayersMutator.resetActionTokens(G.players, ctx.currentPlayer, numActionTokens);

  // reset active moves
  ActionSlotsMutator.reset(G.table.actionSlots);

  console.log('end refill stage')
}
