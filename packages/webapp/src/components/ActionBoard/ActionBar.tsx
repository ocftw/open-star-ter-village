import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ActionMoveName } from '@/game/core/stage/action/move/type';
import { GameContext } from '../GameContextHelpers';
import { GameState } from '@/game/store/store';
import { connectGameContext } from '../GameContextHelpers';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';

enum ActionMoveState {
  Available = 'available',
  Occupied = 'occupied',
  Disabled = 'disabled'
}

type ActionBarProps = {
  actionsState: Record<ActionMoveName | 'endActionTurn', ActionMoveState>;
  onActionClick: (action: string) => void;
};

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  [`&.${ActionMoveState.Available}`]: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    },
  },
  [`&.${ActionMoveState.Occupied}`]: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.warning.dark,
    },
  },
  [`&.${ActionMoveState.Disabled}`]: {
    backgroundColor: theme.palette.action.disabled,
    color: theme.palette.text.disabled,
  },
}));

const EndActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const ActionBar: React.FC<ActionBarProps> = ({ actionsState, onActionClick }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', padding: '8px', backgroundColor: '#f0f0f0' }}>
      <Grid container spacing={1} justifyContent="center">
        {Object.entries(actionsState).map(([action, state]) => (
          action === 'endActionTurn' ? (
            <EndActionButton
              key={action}
              onClick={() => onActionClick(action)}
            >
              End Action Turn
            </EndActionButton>
          ) : (
            <StyledButton
              key={action}
              className={state}
              onClick={() => state === ActionMoveState.Available && onActionClick(action)}
              disabled={state === ActionMoveState.Disabled}
            >
              {action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </StyledButton>
          )
        ))}
      </Grid>
    </Box>
  );
};

const getActionMoveState = (state: GameState, actionMove: ActionMoveName): ActionMoveState => {
  if (!RuleSelector.isActionSlotAvailable(state.rules, actionMove)) {
    return ActionMoveState.Disabled;
  }
  if (ActionSlotSelector.isOccupied(state.table.actionSlots[actionMove])) {
    return ActionMoveState.Occupied;
  }
  return ActionMoveState.Available;
};

const mapGameContextToProps = ({ G }: GameContext) => {
  const actionsState: Record<ActionMoveName | 'endActionTurn', ActionMoveState> = {
    createProject: getActionMoveState(G, 'createProject'),
    recruit: getActionMoveState(G, 'recruit'),
    contributeOwnedProjects: getActionMoveState(G, 'contributeOwnedProjects'),
    contributeJoinedProjects: getActionMoveState(G, 'contributeJoinedProjects'),
    removeAndRefillJobs: getActionMoveState(G, 'removeAndRefillJobs'),
    mirror: getActionMoveState(G, 'mirror'),
    endActionTurn: ActionMoveState.Available,
  };

  const onActionClick = (action: string) => {};

  return { actionsState, onActionClick };
};

export default connectGameContext(mapGameContextToProps)(ActionBar);
