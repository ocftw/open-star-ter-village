import { TableMutator, TableSelector } from "@/game/store/slice/table";
import { GameHookHandler } from "../type";

export const removeEventCard: GameHookHandler = ({ G }) => {
  const eventCard = TableSelector.getCurrentEvent(G.table);
  console.log('remove event card', eventCard?.name);
  TableMutator.removeEvent(G.table);
};
