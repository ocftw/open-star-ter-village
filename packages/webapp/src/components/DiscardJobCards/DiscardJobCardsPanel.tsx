import React, { useEffect } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { connectGameContext } from '@/components/GameContextHelpers';
import { GameContext } from '@/components/GameContextHelpers';
import { AppDispatch } from '@/lib/store';
import { getSelectedJobSlots, resetJobSlotSelection } from '@/lib/reducers/jobSlotSlice';
import { setJobSlotsInteractive, clearJobSlotsInteractive } from '@/lib/reducers/actionStepSlice';

// ── GameContext props ────────────────────────────────────────────────────────

interface GameContextProps {
  onDiscardExcessJobCards: (cardIds: string[]) => void;
}

const mapGameContextToProps = (gameContext: GameContext): GameContextProps => {
  const { moves } = gameContext as GameContext & {
    moves: { discardExcessJobCards: (cardIds: string[]) => void };
  };
  return { onDiscardExcessJobCards: moves.discardExcessJobCards };
};

// ── Redux props ──────────────────────────────────────────────────────────────

interface StateProps {
  selectedJobSlots: string[];
}

const mapStateToProps = createSelector(getSelectedJobSlots, (slots): StateProps => ({
  selectedJobSlots: Object.keys(slots).filter(id => slots[id]),
}));

interface DispatchProps {
  activateJobSlots: () => void;
  deactivateJobSlots: () => void;
  resetJobSlotSelection: () => void;
}

const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => ({
  activateJobSlots: () => dispatch(setJobSlotsInteractive()),
  deactivateJobSlots: () => dispatch(clearJobSlotsInteractive()),
  resetJobSlotSelection: () => dispatch(resetJobSlotSelection()),
});

// ── Component ────────────────────────────────────────────────────────────────

type Props = GameContextProps & StateProps & DispatchProps;

const DiscardJobCardsPanel: React.FC<Props> = ({
  selectedJobSlots,
  activateJobSlots,
  deactivateJobSlots,
  resetJobSlotSelection,
  onDiscardExcessJobCards,
}) => {
  useEffect(() => {
    activateJobSlots();
    return () => {
      deactivateJobSlots();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    onDiscardExcessJobCards(selectedJobSlots);
    resetJobSlotSelection();
  };

  const selected = selectedJobSlots.length;
  const isConfirmEnabled = selected === 2;

  return (
    <Box sx={{ backgroundColor: '#f0f0f0', padding: '16px', mt: 1 }} data-testid="discard-job-cards-panel">
      <Alert severity="warning" icon={false} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
          四大自由:
        </Typography>
        Select 2 job cards to remove from the board before ending your turn.
      </Alert>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography
          variant="body2"
          data-testid="discard-progress"
          color={isConfirmEnabled ? 'text.primary' : 'text.secondary'}
        >
          {selected} / 2 selected
        </Typography>
        <Button
          variant="contained"
          color="warning"
          disabled={!isConfirmEnabled}
          onClick={handleConfirm}
          data-testid="discard-confirm"
        >
          Confirm Discard
        </Button>
      </Box>
    </Box>
  );
};

export default connectGameContext(mapGameContextToProps)(
  connect(mapStateToProps, mapDispatchToProps)(DiscardJobCardsPanel)
);
