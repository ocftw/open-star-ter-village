import React, { useEffect } from 'react';
import { Box, Button, Chip, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { connect } from 'react-redux';
import { StateProps, DispatchProps, GameContextProps, mapStateToProps, mapDispatchToProps, mapGameContextToProps } from './ActionStepper.selectors';
import { connectGameContext } from '../../GameContextHelpers';
import { UserActionMoves } from '@/lib/reducers/actionStepSlice';
import { ActionMoveName } from '@/game/core/stage/action/move/type';

type Props = StateProps & DispatchProps & GameContextProps;

const actionDisplayName: Record<ActionMoveName, string> = {
  createProject: 'Create Project',
  recruit: 'Recruit',
  contributeOwnedProjects: 'Contribute (Own)',
  contributeJoinedProjects: 'Contribute (Joined)',
  removeAndRefillJobs: 'Remove & Refill Jobs',
  mirror: 'Mirror',
};

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
  const activateBoardForAction = (actionName: ActionMoveName) => {
    switch (actionName) {
      case 'createProject':
        setHandPorjectCardsInteractive();
        setJobSlotsInteractive();
        break;
      case 'recruit':
        setJobSlotsInteractive();
        setProjectSlotsInteractive();
        break;
      case 'contributeOwnedProjects':
        setOwnedContributionInteractive();
        break;
      case 'contributeJoinedProjects':
        setJoinedContributionInteractive();
        break;
      case 'removeAndRefillJobs':
        setJobSlotsInteractive();
        break;
    }
  };

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
      case UserActionMoves.Mirror:
        if (currentStep === 1 && mirrorTarget) {
          activateBoardForAction(mirrorTarget);
        }
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAction, currentStep, mirrorTarget]);

  const getMirrorParams = (): any[] => {
    switch (mirrorTarget) {
      case 'createProject': return [selectedHandProjectCards[0], selectedJobSlots[0]];
      case 'recruit': return [selectedJobSlots[0], selectedProjectSlots[0]];
      case 'contributeOwnedProjects': return [contributions];
      case 'contributeJoinedProjects': return [contributions];
      case 'removeAndRefillJobs': return [selectedJobSlots];
      default: return [];
    }
  };

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
        case UserActionMoves.Mirror:
          onMirror(mirrorTarget!, ...getMirrorParams());
          break;
      }
      resetAction();
    } else {
      if (currentAction === UserActionMoves.Mirror && currentStep === 0) {
        // Clear board selections before entering step 1
        resetHandProjectCardSelection();
        resetJobSlotSelection();
        resetProjectSlotSelection();
        resetContribution();
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
        resetHandProjectCardSelection();
        resetJobSlotSelection();
        resetProjectSlotSelection();
        resetContribution();
      }
      setActionStep(currentStep - 1);
    }
  };

  const isMirrorStep1Valid = (): boolean => {
    switch (mirrorTarget) {
      case 'createProject': return selectedHandProjectCards.length === 1 && selectedJobSlots.length === 1;
      case 'recruit': return selectedJobSlots.length === 1 && selectedProjectSlots.length === 1;
      case 'contributeOwnedProjects': {
        const max = getMaxContributionValue(UserActionMoves.ContributeOwnedProjects);
        return 0 < totalContributionValue && totalContributionValue <= max;
      }
      case 'contributeJoinedProjects': {
        const max = getMaxContributionValue(UserActionMoves.ContributeJoinedProjects);
        return 0 < totalContributionValue && totalContributionValue <= max;
      }
      case 'removeAndRefillJobs': return selectedJobSlots.length > 0;
      default: return false;
    }
  };

  const getIsNextEnabled = (): boolean => {
    switch (currentAction) {
      case UserActionMoves.CreateProject:
        return selectedHandProjectCards.length === 1 && selectedJobSlots.length === 1;
      case UserActionMoves.Recruit:
        return selectedJobSlots.length === 1 && selectedProjectSlots.length === 1;
      case UserActionMoves.ContributeOwnedProjects: {
        const maxOwned = getMaxContributionValue(UserActionMoves.ContributeOwnedProjects);
        return 0 < totalContributionValue && totalContributionValue <= maxOwned;
      }
      case UserActionMoves.ContributeJoinedProjects: {
        const maxJoined = getMaxContributionValue(UserActionMoves.ContributeJoinedProjects);
        return 0 < totalContributionValue && totalContributionValue <= maxJoined;
      }
      case UserActionMoves.RemoveAndRefillJobs:
        return selectedJobSlots.length > 0;
      case UserActionMoves.Mirror:
        if (currentStep === 0) return mirrorTarget !== null;
        return isMirrorStep1Valid();
      default:
        return true;
    }
  };

  const getMirrorStep1ProgressMessage = (): string => {
    switch (mirrorTarget) {
      case 'createProject': return `Select ${selectedHandProjectCards.length} Hand Project Card, Select ${selectedJobSlots.length} Job Slot`;
      case 'recruit': return `Select ${selectedJobSlots.length} Job Slot, Select ${selectedProjectSlots.length} Project Slot`;
      case 'contributeOwnedProjects': return `Contribute ${totalContributionValue} / ${getMaxContributionValue(UserActionMoves.ContributeOwnedProjects)} to Owned Projects`;
      case 'contributeJoinedProjects': return `Contribute ${totalContributionValue} / ${getMaxContributionValue(UserActionMoves.ContributeJoinedProjects)} to Joined Projects`;
      case 'removeAndRefillJobs': return `Select ${selectedJobSlots.length} Job Slot`;
      default: return '';
    }
  };

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
      case UserActionMoves.Mirror:
        if (currentStep === 0) return mirrorTarget ? `Repeating: ${actionDisplayName[mirrorTarget]}` : 'Select an action to repeat';
        return getMirrorStep1ProgressMessage();
      default:
        return '';
    }
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
                  label={actionDisplayName[actionName]}
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
