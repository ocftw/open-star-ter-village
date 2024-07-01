import { EventCard, JobCard } from "./card";
import ProjectBoardSlice, { ProjectBoard } from "./projectBoard";
import ActionSlotsSlice, { ActionSlots } from "./actionSlots";

// TODO: move event slot into a separate slice
export type EventSlot = EventCard | null;
// TODO: move job slots into a separate slice
export type JobSlots = JobCard[];

export interface Table {
  eventSlot: EventCard | null;
  projectBoard: ProjectBoard;
  jobSlots: JobCard[];
  actionSlots: ActionSlots;
}

const initialState = (): Table => ({
  eventSlot: null,
  projectBoard: ProjectBoardSlice.initialState(),
  jobSlots: [],
  actionSlots: ActionSlotsSlice.initialState(),
});

const TableSlice = {
  initialState,
};

export default TableSlice;
