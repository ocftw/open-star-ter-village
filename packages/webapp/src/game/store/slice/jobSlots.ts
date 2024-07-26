import { JobCard } from "../../card";

export type JobSlots = JobCard[];

const initialState = (): JobSlots => [];

const mutators = {
  removeJobCards: (state: JobSlots, jobCards: JobCard[]): void => {
    jobCards.forEach((jobCard) => {
      const index = state.findIndex((card) => card.id === jobCard.id);
      if (index !== -1) {
        state.splice(index, 1);
      }
    });
  },
  removeJobCard: (state: JobSlots, jobCard: JobCard): void => {
    const index = state.findIndex((card) => card.id === jobCard.id);
    if (index !== -1) {
      state.splice(index, 1);
    }
  },
  addJobCards: (state: JobSlots, jobCards: JobCard[]): void => {
    state.push(...jobCards);
  },
};

const selectors = {
  getJobCardById: (state: JobSlots, id: string): JobCard | undefined => {
    return state.find((card) => card.id === id);
  },
  getJobCardsByIds: (state: JobSlots, ids: string[]): JobCard[] => {
    return state.filter((card) => ids.includes(card.id));
  },
  getNumFilledSlots: (state: JobSlots): number => {
    return state.length;
  },
};

const JobSlotsSlice = {
  initialState,
  mutators,
  selectors,
};

export const JobSlotsMutator = JobSlotsSlice.mutators;
export const JobSlotsSelector = JobSlotsSlice.selectors;
export default JobSlotsSlice;
