import { AppDispatch } from '@/lib/store';
import { createSelector } from '@reduxjs/toolkit';
import { UserActionMoves, getCurrentAction, getCurrentStep, getMirrorTarget, resetAction, setActionStep, setMirrorTarget, setOwnedContributionInteractive, setHandPorjectCardsInteractive, setJobSlotsInteractive, setProjectSlotsInteractive, setJoinedContributionInteractive } from '@/lib/reducers/actionStepSlice';
import { GameContext } from '../../GameContextHelpers';
import { getSelectedHandProjectCards, resetHandProjectCardSelection } from '@/lib/reducers/handProjectCardSlice';
import { getSelectedJobSlots, resetJobSlotSelection } from '@/lib/reducers/jobSlotSlice';
import { getSelectedProjectSlots, resetProjectSlotSelection } from '@/lib/reducers/projectSlotSlice';
import { ActionMoves } from '@/game/core/stage/action/move/type';
import { getContributions, resetContribution } from '@/lib/reducers/contributionSlice';
import { ContributionAction, getTotalContributionValue } from '@/game/core/ContributionAction';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { ACTION_CONFIGS, MirrorableActionName } from './actionConfig';

export interface GameContextProps {
  getMaxContributionValue: (actionName: MirrorableActionName) => number;
  onCreateProject: ActionMoves['createProject'];
  onRecruit: ActionMoves['recruit'];
  onContributeOwnedProjects: ActionMoves['contributeOwnedProjects'];
  onContributeJoinedProjects: ActionMoves['contributeJoinedProjects'];
  onRemoveAndRefillJobs: ActionMoves['removeAndRefillJobs'];
  onMirror: ActionMoves['mirror'];
  onEndActionTurn: () => void;
  occupiedMirrorableActions: MirrorableActionName[];
}

export const mapGameContextToProps = (gameContext: GameContext): GameContextProps => {
  const { G, events, moves } = gameContext as GameContext & { moves: ActionMoves };
  const getMaxContributionValue = (actionName: MirrorableActionName) => RuleSelector.getMaxContributionValue(G.rules, actionName);

  const mirrorableNames: MirrorableActionName[] = ['createProject', 'recruit', 'contributeOwnedProjects', 'contributeJoinedProjects', 'removeAndRefillJobs'];
  const occupiedMirrorableActions = mirrorableNames.filter(
    (name) => ActionSlotSelector.isOccupied(G.table.actionSlots[name])
  );

  return {
    getMaxContributionValue,
    onCreateProject: moves.createProject,
    onRecruit: moves.recruit,
    onContributeOwnedProjects: moves.contributeOwnedProjects,
    onContributeJoinedProjects: moves.contributeJoinedProjects,
    onRemoveAndRefillJobs: moves.removeAndRefillJobs,
    onMirror: moves.mirror,
    onEndActionTurn: events.endTurn!,
    occupiedMirrorableActions,
  };
}

interface Step {
  name: string;
}

const MIRROR_STEPS: Step[] = [{ name: 'Select Action to Repeat' }, { name: 'Configure Action' }];
const END_TURN_STEPS: Step[] = [{ name: 'Confirm End Action Turn' }];

const getSteps = (currentAction: UserActionMoves | null): Step[] => {
  if (!currentAction) return [];
  if (currentAction === UserActionMoves.Mirror) return MIRROR_STEPS;
  if (currentAction === UserActionMoves.EndActionTurn) return END_TURN_STEPS;
  return ACTION_CONFIGS[currentAction as MirrorableActionName].steps;
};

export interface StateProps {
  steps: Step[];
  currentStep: number;
  currentAction: UserActionMoves | null;
  mirrorTarget: MirrorableActionName | null;
  selectedHandProjectCards: string[];
  selectedJobSlots: string[];
  selectedProjectSlots: string[];
  contributions: ContributionAction[];
  totalContributionValue: number;
}

export const mapStateToProps = createSelector(
  getCurrentStep,
  getCurrentAction,
  getMirrorTarget,
  getSelectedHandProjectCards,
  getSelectedJobSlots,
  getSelectedProjectSlots,
  getContributions,
  (currentStep, currentAction, mirrorTarget, handProjectCards, jobSlots, projectSlots, contributions): StateProps => {
  const steps = getSteps(currentAction);
  const selectedHandProjectCards = Object.keys(handProjectCards).filter(cardId => handProjectCards[cardId]);
  const selectedJobSlots = Object.keys(jobSlots).filter(slotId => jobSlots[slotId]);
  const selectedProjectSlots = Object.keys(projectSlots).filter(slotId => projectSlots[slotId]);
  const totalContributionValue = getTotalContributionValue(contributions);

  return {
    steps,
    currentStep,
    currentAction,
    mirrorTarget,
    selectedHandProjectCards,
    selectedJobSlots,
    selectedProjectSlots,
    contributions,
    totalContributionValue,
  };
});

export interface DispatchProps {
  setActionStep: (step: number) => void;
  setMirrorTarget: (target: MirrorableActionName | null) => void;
  setHandPorjectCardsInteractive: () => void;
  setJobSlotsInteractive: () => void;
  setProjectSlotsInteractive: () => void;
  setOwnedContributionInteractive: () => void;
  setJoinedContributionInteractive: () => void;
  resetAction: () => void;
  resetHandProjectCardSelection: () => void;
  resetJobSlotSelection: () => void;
  resetProjectSlotSelection: () => void;
  resetContribution: () => void;
}

export const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => ({
  setActionStep: (step: number) => dispatch(setActionStep(step)),
  setMirrorTarget: (target: MirrorableActionName | null) => dispatch(setMirrorTarget(target)),
  setHandPorjectCardsInteractive: () => dispatch(setHandPorjectCardsInteractive()),
  setJobSlotsInteractive: () => dispatch(setJobSlotsInteractive()),
  setProjectSlotsInteractive: () => dispatch(setProjectSlotsInteractive()),
  setOwnedContributionInteractive: () => dispatch(setOwnedContributionInteractive()),
  setJoinedContributionInteractive: () => dispatch(setJoinedContributionInteractive()),
  resetAction: () => dispatch(resetAction()),
  resetHandProjectCardSelection: () => dispatch(resetHandProjectCardSelection()),
  resetJobSlotSelection: () => dispatch(resetJobSlotSelection()),
  resetProjectSlotSelection: () => dispatch(resetProjectSlotSelection()),
  resetContribution: () => dispatch(resetContribution()),
});
