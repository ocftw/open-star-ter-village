import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MirrorableActionName } from '@/components/ActionBoard/ActionStepper/actionConfig';

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
  mirrorTarget: MirrorableActionName | null;
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
  mirrorTarget: null,
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
      state.mirrorTarget = null;
      state.interactiveState = initialInteractiveState;
    },
    setMirrorTarget: (state, action: PayloadAction<MirrorableActionName | null>) => {
      state.mirrorTarget = action.payload;
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
    getMirrorTarget: (state: ActionStepState): MirrorableActionName | null => state.mirrorTarget,
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
  setMirrorTarget,
  setHandPorjectCardsInteractive,
  setJobSlotsInteractive,
  setProjectSlotsInteractive,
  setOwnedContributionInteractive,
  setJoinedContributionInteractive,
} = actionStepSlice.actions;

export const {
  getCurrentStep,
  getCurrentAction,
  getMirrorTarget,
  isHandProjectCardsInteractive,
  isJobSlotsInteractive,
  isProjectSlotsInteractive,
  isOwnedContributionInteractive,
  isJoinedContributionInteractive,
} = actionStepSlice.selectors;

export default actionStepSlice.reducer;
