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
  /** Current round, 1-based; incremented each time an event card is played.
   *  Lives on the table because clients cannot see the event deck. */
  round: number;
  /** IDs of the 2 job cards added by 四大自由 that the last player must choose to discard. */
  fourFreedomsPendingDiscards: string[];
  /** Set to true by endActionTurn when the last player still has AP but signals they are done
   *  with their action phase and need to proceed to the 四大自由 discard step. */
  actionPhaseDone: boolean;
}

const initialState = (): Table => ({
  eventSlot: null,
  projectBoard: ProjectBoardSlice.initialState(),
  jobSlots: JobSlotsSlice.initialState(),
  actionSlots: ActionSlotsSlice.initialState(),
  scoreBoard: ScoreBoardSlice.initialState(),
  round: 0,
  fourFreedomsPendingDiscards: [],
  actionPhaseDone: false,
});

const playEvent = (state: Table, eventCard: EventCard): void => {
  state.eventSlot = eventCard;
  state.round += 1;
};

const removeEvent = (state: Table): void => {
  state.eventSlot = null;
};

const getCurrentEvent = (state: Table): EventCard | null => {
  return state.eventSlot;
}

const getRound = (state: Table): number => {
  // Fallback for state persisted before the round counter existed.
  return state.round ?? 0;
}

const TableSlice = {
  initialState,
  mutators: {
    playEvent,
    removeEvent,
  },
  selectors: {
    getCurrentEvent,
    getRound,
  },
};

export const TableMutator = TableSlice.mutators;
export const TableSelector = TableSlice.selectors;
export default TableSlice;
