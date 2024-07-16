import { EventCard } from "../../card";
import ProjectBoardSlice, { ProjectBoard } from "./projectBoard";
import JobSlotsSlice, { JobSlots } from "./jobSlots";
import ActionSlotsSlice, { ActionSlots } from "./actionSlots";
import ScoreBoardSlice, { ScoreBoard } from "./scoreBoard";

// TODO: move event slot into a separate slice
export type EventSlot = EventCard | null;

export interface Table {
  eventSlot: EventCard | null;
  projectBoard: ProjectBoard;
  jobSlots: JobSlots;
  actionSlots: ActionSlots;
  scoreBoard: ScoreBoard;
}

const initialState = (): Table => ({
  eventSlot: null,
  projectBoard: ProjectBoardSlice.initialState(),
  jobSlots: JobSlotsSlice.initialState(),
  actionSlots: ActionSlotsSlice.initialState(),
  scoreBoard: ScoreBoardSlice.initialState(),
});

const playEvent = (state: Table, eventCard: EventCard): void => {
  state.eventSlot = eventCard;
};

const removeEvent = (state: Table): void => {
  state.eventSlot = null;
};

const getCurrentEvent = (state: Table): EventCard | null => {
  return state.eventSlot;
}

const TableSlice = {
  initialState,
  mutators: {
    playEvent,
    removeEvent,
  },
  selectors: {
    getCurrentEvent,
  },
};

export const TableMutator = TableSlice.mutators;
export const TableSelector = TableSlice.selectors;
export default TableSlice;
