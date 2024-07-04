import { JobCard } from "../../card";

export type JobSlots = JobCard[];

const initialState = (): JobSlots => [];

const addJobCard = (state: JobSlots, jobCard: JobCard): void => {
  state.push(jobCard);
}
const removeJobCard = (state: JobSlots, jobCard: JobCard): void => {
  const index = state.findIndex((card) => card.name === jobCard.name);
  if (index !== -1) {
    state.splice(index, 1);
  }
}
const addJobCards = (state: JobSlots, jobCards: JobCard[]): void => {
  state.push(...jobCards);
};

const JobSlotsSlice = {
  initialState,
  mutators: {
    addJobCard,
    removeJobCard,
    addJobCards,
  },
};

export const JobSlotsMutator = JobSlotsSlice.mutators;
export default JobSlotsSlice;
