import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export enum UserActionMoves {
  CreateProject = 'createProject',
  Recruit = 'recruit',
  ContributeOwnedProjects = 'contributeOwnedProjects',
  ContributeJoinedProjects = 'contributeJoinedProjects',
  RemoveAndRefillJobs = 'removeAndRefillJobs',
  EndActionTurn = 'endActionTurn'
}

interface ActionStepState {
  currentAction: UserActionMoves | null;
  interactiveState: {
    handProjectCards: boolean;
    jobSlots: boolean;
    projectSlots: boolean;
    ownedContribution: boolean;
    joinedContribution: boolean;
  };
}

const initialInteractiveState: ActionStepState['interactiveState'] = {
  handProjectCards: false,
  jobSlots: false,
  projectSlots: false,
  ownedContribution: false,
  joinedContribution: false,
};

const initialState: ActionStepState = {
  currentAction: null,
  interactiveState: initialInteractiveState,
};

const actionStepSlice = createSlice({
  name: 'actionSteps',
  initialState,
  reducers: {
    setCurrentAction: (state, action: PayloadAction<UserActionMoves | null>) => {
      state.currentAction = action.payload;
    },
    resetAction: (state) => {
      state.currentAction = null;
      state.interactiveState = initialInteractiveState;
    },
    setHandProjectCardsInteractive: (state) => {
      state.interactiveState.handProjectCards = true;
    },
    setJobSlotsInteractive: (state) => {
      state.interactiveState.jobSlots = true;
    },
    clearJobSlotsInteractive: (state) => {
      state.interactiveState.jobSlots = false;
    },
    setProjectSlotsInteractive: (state) => {
      state.interactiveState.projectSlots = true;
    },
    setOwnedContributionInteractive: (state) => {
      state.interactiveState.ownedContribution = true;
    },
    setJoinedContributionInteractive: (state) => {
      state.interactiveState.joinedContribution = true;
    }
  },
  selectors: {
    getCurrentAction: (state: ActionStepState) => state.currentAction,
    isHandProjectCardsInteractive: (state: ActionStepState) => state.interactiveState.handProjectCards,
    isJobSlotsInteractive: (state: ActionStepState) => state.interactiveState.jobSlots,
    isProjectSlotsInteractive: (state: ActionStepState) => state.interactiveState.projectSlots,
    isOwnedContributionInteractive: (state: ActionStepState) => state.interactiveState.ownedContribution,
    isJoinedContributionInteractive: (state: ActionStepState) => state.interactiveState.joinedContribution,
  }
});

export const {
  setCurrentAction,
  resetAction,
  setHandProjectCardsInteractive,
  setJobSlotsInteractive,
  clearJobSlotsInteractive,
  setProjectSlotsInteractive,
  setOwnedContributionInteractive,
  setJoinedContributionInteractive,
} = actionStepSlice.actions;

export const {
  getCurrentAction,
  isHandProjectCardsInteractive,
  isJobSlotsInteractive,
  isProjectSlotsInteractive,
  isOwnedContributionInteractive,
  isJoinedContributionInteractive,
} = actionStepSlice.selectors;

export default actionStepSlice.reducer;
