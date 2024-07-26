import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export enum UserActionMoves {
  CreateProject = 'createProject',
  Recruit = 'recruit',
  ContributeOwnedProjects = 'contributeOwnedProjects',
  ContributeJoinedProjects = 'contributeJoinedProjects',
  RemoveAndRefillJobs = 'removeAndRefillJobs',
  Mirror = 'mirror',
  EndActionTurn = 'endActionTurn'
}

interface ActionStepState {
  currentStep: number;
  currentAction: UserActionMoves | null;
  interactiveState: {
    handProjectCards: boolean;
    jobSlots: boolean;
    projectSlots: boolean;
    onwedContribution: boolean;
    joinedContribution: boolean;
  };
}

const initialInteractiveState: ActionStepState['interactiveState'] = {
  handProjectCards: false,
  jobSlots: false,
  projectSlots: false,
  onwedContribution: false,
  joinedContribution: false,
};

const initialState: ActionStepState = {
  currentStep: 0,
  currentAction: null,
  interactiveState: initialInteractiveState,
};

const actionStepSlice = createSlice({
  name: 'actionSteps',
  initialState,
  reducers: {
    setActionStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setCurrentAction: (state, action: PayloadAction<UserActionMoves | null>) => {
      state.currentAction = action.payload;
    },
    resetAction: (state) => {
      state.currentStep = 0;
      state.currentAction = null;
      state.interactiveState = initialInteractiveState;
    },
    setHandPorjectCardsInteractive: (state) => {
      state.interactiveState.handProjectCards = true;
    },
    setJobSlotsInteractive: (state) => {
      state.interactiveState.jobSlots = true;
    },
    setProjectSlotsInteractive: (state) => {
      state.interactiveState.projectSlots = true;
    },
    setOwnedContributionInteractive: (state) => {
      state.interactiveState.onwedContribution = true;
    },
    setJoinedContributionInteractive: (state) => {
      state.interactiveState.joinedContribution = true;
    }
  },
  selectors: {
    getCurrentStep: (state: ActionStepState) => state.currentStep,
    getCurrentAction: (state: ActionStepState) => state.currentAction,
    isHandProjectCardsInteractive: (state: ActionStepState) => state.interactiveState.handProjectCards,
    isJobSlotsInteractive: (state: ActionStepState) => state.interactiveState.jobSlots,
    isProjectSlotsInteractive: (state: ActionStepState) => state.interactiveState.projectSlots,
    isOwnedContributionInteractive: (state: ActionStepState) => state.interactiveState.onwedContribution,
    isJoinedContributionInteractive: (state: ActionStepState) => state.interactiveState.joinedContribution,
  }
});

export const {
  setActionStep,
  setCurrentAction,
  resetAction,
  setHandPorjectCardsInteractive,
  setJobSlotsInteractive,
  setProjectSlotsInteractive,
  setOwnedContributionInteractive,
  setJoinedContributionInteractive,
} = actionStepSlice.actions;

export const {
  getCurrentStep,
  getCurrentAction,
  isHandProjectCardsInteractive,
  isJobSlotsInteractive,
  isProjectSlotsInteractive,
  isOwnedContributionInteractive,
  isJoinedContributionInteractive,
} = actionStepSlice.selectors;

export default actionStepSlice.reducer;
