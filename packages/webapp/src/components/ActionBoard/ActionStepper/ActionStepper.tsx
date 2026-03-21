import React, { useEffect } from 'react';
import { Box, Button, Chip, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { connect } from 'react-redux';
import { StateProps, DispatchProps, GameContextProps, mapStateToProps, mapDispatchToProps, mapGameContextToProps } from './ActionStepper.selectors';
import { connectGameContext } from '../../GameContextHelpers';
import { UserActionMoves } from '@/lib/reducers/actionStepSlice';
import { ACTION_CONFIGS, ActionBoardActivators, ActionExecutors, ActionSelectionState, MirrorableActionName } from './actionConfig';

type Props = StateProps & DispatchProps & GameContextProps;

const ActionStepper: React.FC<Props> = ({
  currentStep,
  currentAction,
  mirrorTarget,
  setActionStep,
  setMirrorTarget,
  resetAction,
  steps,
  getMaxContributionValue,
  onCreateProject,
  onRecruit,
  onContributeJoinedProjects,
  onContributeOwnedProjects,
  onRemoveAndRefillJobs,
  onMirror,
  onEndActionTurn,
  occupiedMirrorableActions,
  selectedHandProjectCards,
  selectedJobSlots,
  selectedProjectSlots,
  contributions,
  totalContributionValue,
  setHandProjectCardsInteractive,
  setJobSlotsInteractive,
  setProjectSlotsInteractive,
  setOwnedContributionInteractive,
  setJoinedContributionInteractive,
  resetHandProjectCardSelection,
  resetJobSlotSelection,
  resetProjectSlotSelection,
  resetContribution,
}) => {
  const activators: ActionBoardActivators = {
    setHandProjectCardsInteractive,
    setJobSlotsInteractive,
    setProjectSlotsInteractive,
    setOwnedContributionInteractive,
    setJoinedContributionInteractive,
  };

  const executors: ActionExecutors = {
    createProject: onCreateProject,
    recruit: onRecruit,
    contributeOwnedProjects: onContributeOwnedProjects,
    contributeJoinedProjects: onContributeJoinedProjects,
    removeAndRefillJobs: onRemoveAndRefillJobs,
  };

  const selectionState: ActionSelectionState = {
    selectedHandProjectCards,
    selectedJobSlots,
    selectedProjectSlots,
    contributions,
    totalContributionValue,
    getMaxContributionValue,
  };

  const resetSelections = () => {
    resetHandProjectCardSelection();
    resetJobSlotSelection();
    resetProjectSlotSelection();
    resetContribution();
  };

  useEffect(() => {
    if (!currentAction) {
      resetSelections();
      return;
    }
    if (currentAction === UserActionMoves.Mirror) {
      if (currentStep === 1 && mirrorTarget) {
        ACTION_CONFIGS[mirrorTarget].activateBoard(activators);
      }
    } else if (currentAction !== UserActionMoves.EndActionTurn) {
      ACTION_CONFIGS[currentAction as MirrorableActionName].activateBoard(activators);
    }

    return () => {
      resetSelections();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAction, currentStep, mirrorTarget]);

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      if (currentAction === UserActionMoves.EndActionTurn) {
        onEndActionTurn();
      } else if (currentAction === UserActionMoves.Mirror && mirrorTarget) {
        onMirror(mirrorTarget, ...ACTION_CONFIGS[mirrorTarget].getParams(selectionState));
      } else if (currentAction) {
        ACTION_CONFIGS[currentAction as MirrorableActionName].execute(executors, selectionState);
      }
      resetAction();
    } else {
      if (currentAction === UserActionMoves.Mirror && currentStep === 0) {
        resetSelections();
      }
      setActionStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      resetAction();
    } else {
      if (currentAction === UserActionMoves.Mirror) {
        setMirrorTarget(null);
        resetSelections();
      }
      setActionStep(currentStep - 1);
    }
  };

  const getIsNextEnabled = (): boolean => {
    if (!currentAction) return false;
    if (currentAction === UserActionMoves.EndActionTurn) return true;
    if (currentAction === UserActionMoves.Mirror) {
      if (currentStep === 0) return mirrorTarget !== null;
      return mirrorTarget ? ACTION_CONFIGS[mirrorTarget].isStepValid(selectionState) : false;
    }
    return ACTION_CONFIGS[currentAction as MirrorableActionName].isStepValid(selectionState);
  };

  const getProgressMessage = (): string => {
    if (!currentAction) return '';
    if (currentAction === UserActionMoves.EndActionTurn) return 'Confirm End Action Turn';
    if (currentAction === UserActionMoves.Mirror) {
      if (currentStep === 0) {
        return mirrorTarget
          ? `Repeating: ${ACTION_CONFIGS[mirrorTarget].displayName}`
          : 'Select an action to repeat';
      }
      return mirrorTarget ? ACTION_CONFIGS[mirrorTarget].progressMessage(selectionState) : '';
    }
    return ACTION_CONFIGS[currentAction as MirrorableActionName].progressMessage(selectionState);
  };

  const isNextEnabled = getIsNextEnabled();
  const progressMessage = getProgressMessage();

  return !!currentAction && (
    <Box sx={{ width: '100%', backgroundColor: '#f0f0f0', padding: '16px' }}>
      <Stepper activeStep={currentStep}>
        {steps.map((step) => (
          <Step key={step.name}>
            <StepLabel error={!isNextEnabled}>{step.name}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {currentAction === UserActionMoves.Mirror && currentStep === 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Choose an action already taken this turn to repeat:
          </Typography>
          {occupiedMirrorableActions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No actions available to repeat yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {occupiedMirrorableActions.map((actionName) => (
                <Chip
                  key={actionName}
                  label={ACTION_CONFIGS[actionName].displayName}
                  onClick={() => setMirrorTarget(actionName)}
                  color={mirrorTarget === actionName ? 'primary' : 'default'}
                  variant={mirrorTarget === actionName ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button data-testid="stepper-back" color="inherit" onClick={handleBack} sx={{ mr: 1 }}>
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Box data-testid="stepper-progress" sx={{ flex: '1 1 auto' }}>{progressMessage}</Box>
        <Button data-testid="stepper-next" disabled={!isNextEnabled} onClick={handleNext}>
          {currentStep === steps.length - 1 ? 'Confirm' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default connectGameContext(mapGameContextToProps)(connect(mapStateToProps, mapDispatchToProps)(ActionStepper));
