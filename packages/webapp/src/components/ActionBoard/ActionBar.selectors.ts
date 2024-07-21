import { ActionMoveName, ActionMoves } from '@/game/core/stage/action/move/type';
import { GameContext } from '../GameContextHelpers';
import { GameState } from '@/game/store/store';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { createSelector } from '@reduxjs/toolkit';
import { getSelectedProjectSlots, resetProjectSlotSelection } from '@/lib/reducers/projectSlotSlice';
import { getSelectedJobSlots, resetJobSlotSelection } from '@/lib/reducers/jobSlotSlice';
import { getSelectedHandProjectCards, resetHandProjectCardSelection } from '@/lib/reducers/handProjectCardSlice';
import { AppDispatch } from '@/lib/store';

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

interface DispatchProps {
  resetHandProjectCardSelection: () => void;
  resetJobSlotSelection: () => void;
  resetProjectSlotSelection: () => void;
}

export const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => ({
  resetHandProjectCardSelection: () => dispatch(resetHandProjectCardSelection()),
  resetJobSlotSelection: () => dispatch(resetJobSlotSelection()),
  resetProjectSlotSelection: () => dispatch(resetProjectSlotSelection()),
});

type ReduxProps = StateProps & DispatchProps;

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

export const mapGameContextToProps = (gameContext: GameContext, reduxProps: ReduxProps) => {
  // cast moves to ActionMoves
  const { G, events, moves } = gameContext as GameContext & { moves: ActionMoves };
  const { selectedHandProjectCards, selectedJobSlots, resetHandProjectCardSelection, resetJobSlotSelection } = reduxProps;

  const actionsState: Record<UserActionMoves, ActionMoveState> = {
    [UserActionMoves.CreateProject]: getActionMoveState(G, UserActionMoves.CreateProject),
    [UserActionMoves.Recruit]: getActionMoveState(G, UserActionMoves.Recruit),
    [UserActionMoves.ContributeOwnedProjects]: getActionMoveState(G, UserActionMoves.ContributeOwnedProjects),
    [UserActionMoves.ContributeJoinedProjects]: getActionMoveState(G, UserActionMoves.ContributeJoinedProjects),
    [UserActionMoves.RemoveAndRefillJobs]: getActionMoveState(G, UserActionMoves.RemoveAndRefillJobs),
    [UserActionMoves.Mirror]: getActionMoveState(G, UserActionMoves.Mirror),
    [UserActionMoves.EndActionTurn]: ActionMoveState.Available,
  };

  const onCreateProject = () => {
    if (selectedHandProjectCards.length === 1 && selectedJobSlots.length === 1) {
      moves.createProject(selectedHandProjectCards[0], selectedJobSlots[0]);
      resetHandProjectCardSelection();
      resetJobSlotSelection();
    } else {
      // show error message
    }
  }

  const onEndActionTurn = () => {
    events.endTurn!();
  };

  const onActionClick = (action: UserActionMoves) => {
    switch (action) {
      case UserActionMoves.CreateProject:
        onCreateProject();
        break;
      case UserActionMoves.EndActionTurn:
        onEndActionTurn();
        break;
    }
  };

  return { actionsState, onActionClick };
};
