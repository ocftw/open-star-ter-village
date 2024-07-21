import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { connectGameContext } from '../GameContextHelpers';
import { connect } from 'react-redux';
import { UserActionMoves, ActionMoveState, mapStateToProps, mapGameContextToProps } from './ActionBar.selectors';

type ActionBarProps = {
  actionsState: Record<UserActionMoves, ActionMoveState>;
  onActionClick: (action: UserActionMoves) => void;
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
          action === UserActionMoves.EndActionTurn ? (
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
              onClick={() => state === ActionMoveState.Available && onActionClick(action as UserActionMoves)}
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

export default connect(mapStateToProps)(connectGameContext(mapGameContextToProps)(ActionBar));
