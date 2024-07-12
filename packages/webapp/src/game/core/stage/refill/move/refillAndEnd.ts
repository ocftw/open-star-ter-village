import { GameMove } from "@/game/core/type";
import { ActionSlotsMutator } from "@/game/store/slice/actionSlots";
import { DeckMutator, DeckSelector } from "@/game/store/slice/deck";
import { PlayersMutator, PlayersSelector } from "@/game/store/slice/players";
import { RuleSelector } from "@/game/store/slice/rule";

export type RefillAndEnd = () => void;
export const refillAndEnd: GameMove<RefillAndEnd> = ({ G, playerID, events }) => {
  console.log('refill stage')
  // refill project cards
  const maxProjectCards = RuleSelector.getPlayerMaxProjectCards(G.rules);
  const numProjectsInHand = PlayersSelector.getNumProjects(G.players, playerID);
  const refillCardNumber = maxProjectCards - numProjectsInHand;
  const projectCards = DeckSelector.peek(G.decks.projects, refillCardNumber);
  DeckMutator.draw(G.decks.projects, refillCardNumber);
  PlayersMutator.addProjects(G.players, playerID, projectCards);

  // refill action points
  const numActionTokens = RuleSelector.getPlayerMaxActionTokens(G.rules);
  PlayersMutator.resetActionTokens(G.players, playerID, numActionTokens);

  // reset active moves
  ActionSlotsMutator.reset(G.table.actionSlots);

  console.log('end refill stage')

  console.log('end turn')
  events.endTurn()
}
