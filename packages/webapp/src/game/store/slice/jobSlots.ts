import { JobCard } from "../../card";

export type JobSlots = JobCard[];

const initialState = (): JobSlots => [];

const removeJobCard = (state: JobSlots, jobCard: JobCard): void => {
  const index = state.findIndex((card) => card.id === jobCard.id);
  if (index !== -1) {
    state.splice(index, 1);
  }
}
const addJobCards = (state: JobSlots, jobCards: JobCard[]): void => {
  state.push(...jobCards);
};

const selectors = {
  getJobCardById: (state: JobSlots, id: string): JobCard | undefined => {
    return state.find((card) => card.id === id);
  },
};

const JobSlotsSlice = {
  initialState,
  mutators: {
    removeJobCard,
    addJobCards,
  },
  selectors,
};

export const JobSlotsMutator = JobSlotsSlice.mutators;
export const JobSlotsSelector = JobSlotsSlice.selectors;
export default JobSlotsSlice;
