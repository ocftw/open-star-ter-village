import React, { useEffect } from 'react';
import { Box, Button, Step, StepLabel, Stepper } from '@mui/material';
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
  getMaxContributionValue,
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
  contributions,
  totalContributionValue,
  setHandPorjectCardsInteractive,
  setJobSlotsInteractive,
  setProjectSlotsInteractive,
  setOwnedContributionInteractive,
  setJoinedContributionInteractive,
  resetHandProjectCardSelection,
  resetJobSlotSelection,
  resetProjectSlotSelection,
  resetContribution,
}) => {
  useEffect(() => {
    switch (currentAction) {
      case null:
        resetHandProjectCardSelection();
        resetJobSlotSelection();
        resetProjectSlotSelection();
        resetContribution();
        break;
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
  }, [currentAction, currentStep]);

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      switch (currentAction) {
        case UserActionMoves.CreateProject:
          onCreateProject(selectedHandProjectCards[0], selectedJobSlots[0]);
          break;
        case UserActionMoves.Recruit:
          onRecruit(selectedJobSlots[0], selectedProjectSlots[0]);
          break;
        case UserActionMoves.ContributeOwnedProjects:
          onContributeOwnedProjects(contributions);
          break;
        case UserActionMoves.ContributeJoinedProjects:
          onContributeJoinedProjects(contributions);
          break;
        case UserActionMoves.RemoveAndRefillJobs:
          onRemoveAndRefillJobs(selectedJobSlots);
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
      case UserActionMoves.ContributeOwnedProjects:
        const maxOwned = getMaxContributionValue(UserActionMoves.ContributeOwnedProjects);
        return 0 < totalContributionValue && totalContributionValue <= maxOwned;
      case UserActionMoves.ContributeJoinedProjects:
        const maxJoined = getMaxContributionValue(UserActionMoves.ContributeJoinedProjects);
        return 0 < totalContributionValue && totalContributionValue <= maxJoined;
      case UserActionMoves.RemoveAndRefillJobs:
        return selectedJobSlots.length > 0;
      default:
        return true;
    }
  };

  const isNextEnabled = getIsNextEnabled();

  const getProgressMessage = (): string => {
    switch (currentAction) {
      case UserActionMoves.CreateProject:
        return `Select ${selectedHandProjectCards.length} Hand Project Card, Select ${selectedJobSlots.length} Job Slot`;
      case UserActionMoves.Recruit:
        return `Select ${selectedJobSlots.length} Job Slot, Select ${selectedProjectSlots.length} Project Slot`;
      case UserActionMoves.ContributeOwnedProjects:
        return `Contribute ${totalContributionValue} / ${getMaxContributionValue(UserActionMoves.ContributeOwnedProjects)} to Owned Projects`;
      case UserActionMoves.ContributeJoinedProjects:
        return `Contribute ${totalContributionValue} / ${getMaxContributionValue(UserActionMoves.ContributeJoinedProjects)} to Joined Projects`;
      case UserActionMoves.RemoveAndRefillJobs:
        return `Select ${selectedJobSlots.length} Job Slot`;
      case UserActionMoves.EndActionTurn:
        return 'Confirm End Action Turn';
      default:
        return '';
    }
  };

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
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button color="inherit" onClick={handleBack} sx={{ mr: 1 }}>
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Box sx={{ flex: '1 1 auto' }}>{progressMessage}</Box>
        <Button disabled={!isNextEnabled} onClick={handleNext}>
          {currentStep === steps.length - 1 ? 'Confirm' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default connectGameContext(mapGameContextToProps)(connect(mapStateToProps, mapDispatchToProps)(ActionStepper));
