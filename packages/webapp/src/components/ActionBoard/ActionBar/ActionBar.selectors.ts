import { ActionMoveName } from '@/game/core/stage/action/move/type';
import { GameContext } from '../../GameContextHelpers';
import { GameState } from '@/game/store/store';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { AppDispatch } from '@/lib/store';
import { UserActionMoves, getCurrentAction, setCurrentAction } from '@/lib/reducers/actionStepSlice';
import { createSelector } from '@reduxjs/toolkit';

export interface StateProps {
  isActionBarVisible: boolean;
}

export const mapStateToProps = createSelector(getCurrentAction, (currentAction) => ({
  isActionBarVisible: currentAction === null,
}));

export interface DispatchProps {
  onActionClick: (action: UserActionMoves) => void;
}

export const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => ({
  onActionClick: (action: UserActionMoves) => dispatch(setCurrentAction(action)),
});

export enum ActionMoveState {
  Available = 'available',
  Occupied = 'occupied',
  Disabled = 'disabled'
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

export interface GameContextProps {
  actionsState: Record<UserActionMoves, ActionMoveState>;
}

export const mapGameContextToProps = ({ G }: GameContext) => {
  const actionsState: Record<UserActionMoves, ActionMoveState> = {
    [UserActionMoves.CreateProject]: getActionMoveState(G, UserActionMoves.CreateProject),
    [UserActionMoves.Recruit]: getActionMoveState(G, UserActionMoves.Recruit),
    [UserActionMoves.ContributeOwnedProjects]: getActionMoveState(G, UserActionMoves.ContributeOwnedProjects),
    [UserActionMoves.ContributeJoinedProjects]: getActionMoveState(G, UserActionMoves.ContributeJoinedProjects),
    [UserActionMoves.RemoveAndRefillJobs]: getActionMoveState(G, UserActionMoves.RemoveAndRefillJobs),
    [UserActionMoves.Mirror]: getActionMoveState(G, UserActionMoves.Mirror),
    [UserActionMoves.EndActionTurn]: ActionMoveState.Available,
  };

  return { actionsState };
};
