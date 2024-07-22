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
    contribution: boolean
  };
}

const initialInteractiveState = {
  handProjectCards: false,
  jobSlots: false,
  projectSlots: false,
  contribution: false,
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
    setHandPorjectCardsInteractiveState: (state, action: PayloadAction<boolean>) => {
      state.interactiveState.handProjectCards = action.payload;
    },
    setJobSlotsInteractiveState: (state, action: PayloadAction<boolean>) => {
      state.interactiveState.jobSlots = action.payload;
    },
    setProjectSlotsInteractiveState: (state, action: PayloadAction<boolean>) => {
      state.interactiveState.projectSlots = action.payload;
    },
    setContributionInteractiveState: (state, action: PayloadAction<boolean>) => {
      state.interactiveState.contribution = action.payload;
    },
  },
  selectors: {
    getCurrentStep: (state: ActionStepState) => state.currentStep,
    getCurrentAction: (state: ActionStepState) => state.currentAction,
    isProjectCardsInteractive: (state: ActionStepState) => state.interactiveState.handProjectCards,
    isJobSlotsInteractive: (state: ActionStepState) => state.interactiveState.jobSlots,
    isProjectSlotsInteractive: (state: ActionStepState) => state.interactiveState.projectSlots,
    isContributionInteractive: (state: ActionStepState) => state.interactiveState.contribution,
  }
});

export const { setActionStep, setCurrentAction, resetAction, setHandPorjectCardsInteractiveState, setJobSlotsInteractiveState, setProjectSlotsInteractiveState, setContributionInteractiveState} = actionStepSlice.actions;
export const { getCurrentStep, getCurrentAction, isProjectCardsInteractive, isJobSlotsInteractive, isProjectSlotsInteractive, isContributionInteractive } = actionStepSlice.selectors;

export default actionStepSlice.reducer;
