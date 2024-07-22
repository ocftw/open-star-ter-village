import React, { use, useEffect } from 'react';
import { Box, Button, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { connect } from 'react-redux';
import { StateProps, DispatchProps, GameContextProps, mapStateToProps, mapDispatchToProps, mapGameContextToProps } from './ActionStepper.selectors';
import { connectGameContext } from '../../GameContextHelpers';
import { UserActionMoves } from '@/lib/reducers/actionStepSlice';

type Props = StateProps & DispatchProps & GameContextProps;

const ActionStepper: React.FC<Props> = ({
  currentStep,
  currentAction,
  setActionStep,
  resetAction,
  steps,
  onCreateProject,
  onRecruit,
  onContributeJoinedProjects,
  onContributeOwnedProjects,
  onRemoveAndRefillJobs,
  onMirror,
  onEndActionTurn,
  selectedHandProjectCards,
  selectedJobSlots,
  selectedProjectSlots,
  setHandPorjectCardsInteractive,
  setJobSlotsInteractive,
  setProjectSlotsInteractive,
  setOwnedContributionInteractive,
  setJoinedContributionInteractive,
  resetHandProjectCardSelection,
  resetJobSlotSelection,
  resetProjectSlotSelection,
}) => {
  useEffect(() => {
    if (currentAction === null) {
      resetAction();
    } else {
      switch (currentAction) {
        case UserActionMoves.CreateProject:
          if (currentStep === 0) {
            setHandPorjectCardsInteractive();
            setJobSlotsInteractive();
          }
          break;
        case UserActionMoves.Recruit:
          if (currentStep === 0) {
            setJobSlotsInteractive();
            setProjectSlotsInteractive();
          }
          break;
        case UserActionMoves.ContributeOwnedProjects:
          if (currentStep === 0) {
            setOwnedContributionInteractive();
          }
          break;
        case UserActionMoves.ContributeJoinedProjects:
          if (currentStep === 0) {
            setJoinedContributionInteractive();
          }
          break;
        case UserActionMoves.RemoveAndRefillJobs:
          if (currentStep === 0) {
            setJobSlotsInteractive();
          }
          break;
      }
    }
  }, [currentAction, currentStep]);

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      switch (currentAction) {
        case UserActionMoves.CreateProject:
          onCreateProject(selectedHandProjectCards[0], selectedJobSlots[0]);
          resetHandProjectCardSelection();
          resetJobSlotSelection();
          break;
        case UserActionMoves.Recruit:
          onRecruit(selectedJobSlots[0], selectedProjectSlots[0]);
          resetJobSlotSelection();
          resetProjectSlotSelection();
          break;
        case UserActionMoves.RemoveAndRefillJobs:
          onRemoveAndRefillJobs(selectedJobSlots);
          resetJobSlotSelection();
          break;
        case UserActionMoves.EndActionTurn:
          onEndActionTurn();
          break;
      }
      resetAction();
    } else {
      setActionStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      resetAction();
    } else {
      setActionStep(currentStep - 1);
    }
  };

  const getIsNextEnabled = (): boolean => {
    switch (currentAction) {
      case UserActionMoves.CreateProject:
        return selectedHandProjectCards.length === 1 && selectedJobSlots.length === 1;
      case UserActionMoves.Recruit:
        return selectedJobSlots.length === 1 && selectedProjectSlots.length === 1;
      case UserActionMoves.RemoveAndRefillJobs:
        return selectedJobSlots.length > 0;
      default:
        return true;
    }
  };

  const isNextEnabled = getIsNextEnabled();

  return !!currentAction && (
    <Box sx={{ width: '100%', backgroundColor: '#f0f0f0', padding: '16px' }}>
      <Stepper activeStep={currentStep}>
        {steps.map((step) => (
          <Step key={step.name}>
            <StepLabel error={!isNextEnabled}>{step.name}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button color="inherit" onClick={handleBack} sx={{ mr: 1 }}>
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button disabled={!isNextEnabled} onClick={handleNext}>
          {currentStep === steps.length - 1 ? 'Confirm' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default connectGameContext(mapGameContextToProps)(connect(mapStateToProps, mapDispatchToProps)(ActionStepper));
