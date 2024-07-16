import { DeckMutator, DeckSelector } from "@/game/store/slice/deck";
import { GameHookHandler } from "../type";
import { TableMutator } from "@/game/store/slice/table";

export const playEventCard: GameHookHandler = ({ G }) => {
  const eventCard = DeckSelector.peek(G.decks.events, 1);
  DeckMutator.draw(G.decks.events, 1);
  console.log('play event card', eventCard[0].name);
  TableMutator.playEvent(G.table, eventCard[0]);
};
