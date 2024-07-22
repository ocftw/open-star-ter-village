import { AppDispatch } from '@/lib/store';
import { createSelector } from '@reduxjs/toolkit';
import { UserActionMoves, getCurrentAction, getCurrentStep, resetAction, setActionStep, setOwnedContributionInteractive, setHandPorjectCardsInteractive, setJobSlotsInteractive, setProjectSlotsInteractive, setJoinedContributionInteractive } from '@/lib/reducers/actionStepSlice';
import { GameContext } from '../../GameContextHelpers';
import { getSelectedHandProjectCards, resetHandProjectCardSelection } from '@/lib/reducers/handProjectCardSlice';
import { getSelectedJobSlots, resetJobSlotSelection } from '@/lib/reducers/jobSlotSlice';
import { getSelectedProjectSlots, resetProjectSlotSelection } from '@/lib/reducers/projectSlotSlice';
import { ActionMoves } from '@/game/core/stage/action/move/type';

export interface GameContextProps {
  onCreateProject: ActionMoves['createProject'];
  onRecruit: ActionMoves['recruit'];
  onContributeOwnedProjects: ActionMoves['contributeOwnedProjects'];
  onContributeJoinedProjects: ActionMoves['contributeJoinedProjects'];
  onRemoveAndRefillJobs: ActionMoves['removeAndRefillJobs'];
  onMirror: ActionMoves['mirror'];
  onEndActionTurn: () => void;
}

export const mapGameContextToProps = (gameContext: GameContext): GameContextProps => {
  const { events, moves } = gameContext as GameContext & { moves: ActionMoves };
  return {
    onCreateProject: moves.createProject,
    onRecruit: moves.recruit,
    onContributeOwnedProjects: moves.contributeOwnedProjects,
    onContributeJoinedProjects: moves.contributeJoinedProjects,
    onRemoveAndRefillJobs: moves.removeAndRefillJobs,
    onMirror: moves.mirror,
    onEndActionTurn: events.endTurn!,
  };
}

interface Step {
  name: string;
}

export interface StateProps {
  steps: Step[];
  currentStep: number;
  currentAction: UserActionMoves | null;
  selectedHandProjectCards: string[];
  selectedJobSlots: string[];
  selectedProjectSlots: string[];
}

const stepsMap: Record<UserActionMoves, Step[]> = {
  createProject: [{name: 'Select One Hand Project Card, Select One Job Slot'}],
  recruit: [{name: 'Select One Job Slot, Select One Project Slot'}],
  contributeOwnedProjects: [{name: 'Contribute to Owned Projects'}],
  contributeJoinedProjects: [{name: 'Contribute to Joined Projects'}],
  removeAndRefillJobs: [{name: 'Select At least One Job Slot'}],
  mirror: [{name: 'Select One Action Slot'}, {name: 'TBD'}],
  endActionTurn: [{name: 'Confirm End Action Turn'}],
}

export const mapStateToProps = createSelector(
  getCurrentStep,
  getCurrentAction,
  getSelectedHandProjectCards,
  getSelectedJobSlots,
  getSelectedProjectSlots,
  (currentStep, currentAction, handProjectCards, jobSlots, projectSlots): StateProps => {
  const steps = currentAction ? stepsMap[currentAction] : [];
  const selectedHandProjectCards = Object.keys(handProjectCards).filter(cardId => handProjectCards[cardId]);
  const selectedJobSlots = Object.keys(jobSlots).filter(slotId => jobSlots[slotId]);
  const selectedProjectSlots = Object.keys(projectSlots).filter(slotId => projectSlots[slotId]);

  return {
    steps,
    currentStep,
    currentAction,
    selectedHandProjectCards,
    selectedJobSlots,
    selectedProjectSlots,
  };
});

export interface DispatchProps {
  setActionStep: (step: number) => void;
  setHandPorjectCardsInteractive: () => void;
  setJobSlotsInteractive: () => void;
  setProjectSlotsInteractive: () => void;
  setOwnedContributionInteractive: () => void;
  setJoinedContributionInteractive: () => void;
  resetAction: () => void;
  resetHandProjectCardSelection: () => void;
  resetJobSlotSelection: () => void;
  resetProjectSlotSelection: () => void;
}

export const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => ({
  setActionStep: (step: number) => dispatch(setActionStep(step)),
  setHandPorjectCardsInteractive: () => dispatch(setHandPorjectCardsInteractive()),
  setJobSlotsInteractive: () => dispatch(setJobSlotsInteractive()),
  setProjectSlotsInteractive: () => dispatch(setProjectSlotsInteractive()),
  setOwnedContributionInteractive: () => dispatch(setOwnedContributionInteractive()),
  setJoinedContributionInteractive: () => dispatch(setJoinedContributionInteractive()),
  resetAction: () => dispatch(resetAction()),
  resetHandProjectCardSelection: () => dispatch(resetHandProjectCardSelection()),
  resetJobSlotSelection: () => dispatch(resetJobSlotSelection()),
  resetProjectSlotSelection: () => dispatch(resetProjectSlotSelection()),
});
