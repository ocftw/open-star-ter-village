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
  /**
   * 斜槓青年: the required profession position chosen for a job card
   * that does not match the target project's requirements.
   */
  assignedJobName: string | null;
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
  assignedJobName: null,
  interactiveState: initialInteractiveState,
};

const actionStepSlice = createSlice({
  name: 'actionSteps',
  initialState,
  reducers: {
    setCurrentAction: (state, action: PayloadAction<UserActionMoves | null>) => {
      state.currentAction = action.payload;
      state.assignedJobName = null;
    },
    setAssignedJobName: (state, action: PayloadAction<string | null>) => {
      state.assignedJobName = action.payload;
    },
    resetAction: (state) => {
      state.currentAction = null;
      state.assignedJobName = null;
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
    getAssignedJobName: (state: ActionStepState) => state.assignedJobName,
    isHandProjectCardsInteractive: (state: ActionStepState) => state.interactiveState.handProjectCards,
    isJobSlotsInteractive: (state: ActionStepState) => state.interactiveState.jobSlots,
    isProjectSlotsInteractive: (state: ActionStepState) => state.interactiveState.projectSlots,
    isOwnedContributionInteractive: (state: ActionStepState) => state.interactiveState.ownedContribution,
    isJoinedContributionInteractive: (state: ActionStepState) => state.interactiveState.joinedContribution,
  }
});

export const {
  setCurrentAction,
  setAssignedJobName,
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
  getAssignedJobName,
  isHandProjectCardsInteractive,
  isJobSlotsInteractive,
  isProjectSlotsInteractive,
  isOwnedContributionInteractive,
  isJoinedContributionInteractive,
} = actionStepSlice.selectors;

export default actionStepSlice.reducer;
