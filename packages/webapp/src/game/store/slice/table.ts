import { EventCard, JobCard } from "../../card";
import ProjectBoardSlice, { ProjectBoard } from "./projectBoard";
import ActionSlotsSlice, { ActionSlots } from "./actionSlots";
import ScoreBoardSlice, { ScoreBoard } from "./scoreBoard";

// TODO: move event slot into a separate slice
export type EventSlot = EventCard | null;
// TODO: move job slots into a separate slice
export type JobSlots = JobCard[];

export interface Table {
  eventSlot: EventCard | null;
  projectBoard: ProjectBoard;
  jobSlots: JobCard[];
  actionSlots: ActionSlots;
  scoreBoard: ScoreBoard;
}

const initialState = (): Table => ({
  eventSlot: null,
  projectBoard: ProjectBoardSlice.initialState(),
  jobSlots: [],
  actionSlots: ActionSlotsSlice.initialState(),
  scoreBoard: ScoreBoardSlice.initialState(),
});

const TableSlice = {
  initialState,
};

export default TableSlice;
