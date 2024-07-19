import { DeckMutator, DeckSelector } from "@/game/store/slice/deck";
import { GameHookHandler } from "../type";
import { TableMutator } from "@/game/store/slice/table";
import { eventCardHandlers } from "./eventCardHandlers";

export const playEventCard: GameHookHandler = (context) => {
  const { G } = context;
  const eventCard = DeckSelector.peek(G.decks.events, 1)[0];
  DeckMutator.draw(G.decks.events, 1);
  console.log('play event card', eventCard.name);
  TableMutator.playEvent(G.table, eventCard);

  const eventCardHandler = eventCardHandlers[eventCard.function_name];
  eventCardHandler?.start(context);
};
