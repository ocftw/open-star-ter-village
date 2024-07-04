import { GameMove } from "@/game/core/type";
import { ActionSlotsMutator } from "@/game/store/slice/actionSlots";
import { DeckMutator, DeckSelector } from "@/game/store/slice/deck";
import { PlayersMutator, PlayersSelector } from "@/game/store/slice/players";

export type RefillAndEnd = () => void;
export const refillAndEnd: GameMove<RefillAndEnd> = ({ G, ctx, events }) => {
  // refill project cards
  const maxProjectCards = 2;
  const numProjectsInHand = PlayersSelector.getNumProjects(G.players, ctx.currentPlayer);
  const refillCardNumber = maxProjectCards - numProjectsInHand;
  const projectCards = DeckSelector.peek(G.decks.projects, refillCardNumber);
  DeckMutator.draw(G.decks.projects, refillCardNumber);
  PlayersMutator.addProjects(G.players, ctx.currentPlayer, projectCards);

  // refill action points
  const numActionTokens = 4;
  PlayersMutator.resetActionTokens(G.players, ctx.currentPlayer, numActionTokens);

  // reset active moves
  ActionSlotsMutator.reset(G.table.actionSlots);
  events.endTurn()
}
