import { ActionMoveName } from '@/game/core/stage/action/move/type';
import { GameContext } from '../GameContextHelpers';
import { GameState } from '@/game/store/store';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { createSelector } from '@reduxjs/toolkit';
import { getSelectedProjectSlots } from '@/lib/reducers/projectSlotSlice';
import { getSelectedJobSlots } from '@/lib/reducers/jobSlotSlice';
import { getSelectedHandProjectCards } from '@/lib/reducers/handProjectCardSlice';

interface StateProps {
  selectedHandProjectCards: string[];
  selectedJobSlots: string[];
  selectedProjectSlots: string[];
}

export const mapStateToProps = createSelector(
  getSelectedHandProjectCards,
  getSelectedJobSlots,
  getSelectedProjectSlots,
  (handProjectCards, jobSlots, projectSlots) => {
    const selectedHandProjectCards = Object.keys(handProjectCards).filter(cardId => handProjectCards[cardId]);
    const selectedJobSlots = Object.keys(jobSlots).filter(slotId => jobSlots[slotId]);
    const selectedProjectSlots = Object.keys(projectSlots).filter(slotId => projectSlots[slotId]);

    return {
      selectedHandProjectCards,
      selectedJobSlots,
      selectedProjectSlots,
    };
  }
);

export enum ActionMoveState {
  Available = 'available',
  Occupied = 'occupied',
  Disabled = 'disabled'
}

export enum UserActionMoves {
  CreateProject = 'createProject',
  Recruit = 'recruit',
  ContributeOwnedProjects = 'contributeOwnedProjects',
  ContributeJoinedProjects = 'contributeJoinedProjects',
  RemoveAndRefillJobs = 'removeAndRefillJobs',
  Mirror = 'mirror',
  EndActionTurn = 'endActionTurn'
}

const getActionMoveState = (state: GameState, actionMove: ActionMoveName): ActionMoveState => {
  if (!RuleSelector.isActionSlotAvailable(state.rules, actionMove)) {
    return ActionMoveState.Disabled;
  }
  if (ActionSlotSelector.isOccupied(state.table.actionSlots[actionMove])) {
    return ActionMoveState.Occupied;
  }
  return ActionMoveState.Available;
};

export const mapGameContextToProps = (gameContext: GameContext, stateProps: StateProps) => {
  const { G, events } = gameContext;

  const actionsState: Record<UserActionMoves, ActionMoveState> = {
    [UserActionMoves.CreateProject]: getActionMoveState(G, UserActionMoves.CreateProject),
    [UserActionMoves.Recruit]: getActionMoveState(G, UserActionMoves.Recruit),
    [UserActionMoves.ContributeOwnedProjects]: getActionMoveState(G, UserActionMoves.ContributeOwnedProjects),
    [UserActionMoves.ContributeJoinedProjects]: getActionMoveState(G, UserActionMoves.ContributeJoinedProjects),
    [UserActionMoves.RemoveAndRefillJobs]: getActionMoveState(G, UserActionMoves.RemoveAndRefillJobs),
    [UserActionMoves.Mirror]: getActionMoveState(G, UserActionMoves.Mirror),
    [UserActionMoves.EndActionTurn]: ActionMoveState.Available,
  };

  const onEndActionTurn = () => {
    events.endTurn!();
  };

  const onActionClick = (action: UserActionMoves) => {
    switch (action) {
      case UserActionMoves.EndActionTurn:
        onEndActionTurn();
        break;
    }
  };

  return { actionsState, onActionClick };
};
