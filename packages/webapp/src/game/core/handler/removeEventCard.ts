import { TableMutator, TableSelector } from "@/game/store/slice/table";
import { GameHookHandler } from "../type";
import { eventCardHandlers } from "./eventCardHandlers";
import { DeckMutator } from "@/game/store/slice/deck";

export const removeEventCard: GameHookHandler = (context) => {
  const { G } = context;
  const eventCard = TableSelector.getCurrentEvent(G.table);
  console.log('remove event card', eventCard!.name);
  const eventCardHandler = eventCardHandlers[eventCard!.function_name];
  eventCardHandler?.end?.(context);

  TableMutator.removeEvent(G.table);
  DeckMutator.discard(G.decks.events, [eventCard!]);
};
