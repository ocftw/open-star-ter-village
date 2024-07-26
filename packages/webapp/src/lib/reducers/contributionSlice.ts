import { JobName, ProjectSlotID } from '@/game';
import { ContributionAction } from '@/game/core/ContributionAction';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ContributionState {
  contributions: ContributionAction[];
}

const initialState: ContributionState = {
  contributions: [],
};

interface UpdateContributePayload {
  slotId: ProjectSlotID;
  jobName: JobName;
  diffAmount: number;
}

const contributionSlice = createSlice({
  name: 'contributions',
  initialState,
  reducers: {
    updateContribute: (state, action: PayloadAction<UpdateContributePayload>) => {
      const { slotId, jobName, diffAmount } = action.payload;
      const contribution = state.contributions.find((c) => c.projectSlotId === slotId && c.jobName === jobName);
      if (contribution) {
        contribution.value = diffAmount;
      } else {
        state.contributions.push({ projectSlotId: slotId, jobName, value: diffAmount });
      }
    },
    resetContribution: (state) => {
      state.contributions = [];
    },
  },
  selectors: {
    getContributions: (state: ContributionState) => state.contributions,
  },
});

export const { updateContribute, resetContribution } = contributionSlice.actions;
export const { getContributions } = contributionSlice.selectors;

export default contributionSlice.reducer;
