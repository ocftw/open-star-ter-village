import { ActionMoveName, ActionMoves } from '@/game/core/stage/action/move/type';
import { ContributionAction } from '@/game/core/ContributionAction';
import { ActionExecutionOptions } from '@/game/core/stage/action/validate';

/** The 5 regular action moves driven by the contextual confirm flow. */
export type RegularActionName = ActionMoveName;

/** Selection data from the Redux store available to every action config. */
export interface ActionSelectionState {
  selectedHandProjectCards: string[];
  selectedJobSlots: string[];
  selectedProjectSlots: string[];
  /** 斜槓青年: chosen target position for a mismatched job card. */
  assignedJobName: string | null;
  contributions: ContributionAction[];
  totalContributionValue: number;
  getMaxContributionValue: (name: RegularActionName) => number;
}

/** Redux dispatch functions that make board elements interactive. */
export interface ActionBoardActivators {
  setHandProjectCardsInteractive: () => void;
  setJobSlotsInteractive: () => void;
  setProjectSlotsInteractive: () => void;
  setOwnedContributionInteractive: () => void;
  setJoinedContributionInteractive: () => void;
}

/** boardgame.io move functions for the 5 regular actions. */
export type ActionExecutors = ActionMoves;

/** Full behavioural description of a single action step. */
export interface ActionConfig {
  displayName: string;
  steps: { name: string }[];
  /** Called on step entry to enable the relevant board elements. */
  activateBoard(activators: ActionBoardActivators): void;
  /** Whether the current selection is complete enough to proceed. */
  isStepValid(state: ActionSelectionState): boolean;
  /** Human-readable progress description shown in the stepper bar. */
  progressMessage(state: ActionSelectionState): string;
  /** Arguments to pass to the boardgame.io move (before the options param). */
  getParams(state: ActionSelectionState): unknown[];
  /** Dispatch the actual boardgame.io move; options carries 加班 Overtime mode. */
  execute(executors: ActionExecutors, state: ActionSelectionState, options?: ActionExecutionOptions): void;
}

export const ACTION_CONFIGS: Record<RegularActionName, ActionConfig> = {
  createProject: {
    displayName: 'Create Project',
    steps: [{ name: 'Select One Hand Project Card, Select One Job Slot' }],
    activateBoard: ({ setHandProjectCardsInteractive, setJobSlotsInteractive }) => {
      setHandProjectCardsInteractive();
      setJobSlotsInteractive();
    },
    isStepValid: ({ selectedHandProjectCards, selectedJobSlots }) =>
      selectedHandProjectCards.length === 1 && selectedJobSlots.length === 1,
    progressMessage: ({ selectedHandProjectCards, selectedJobSlots }) =>
      `Select ${selectedHandProjectCards.length} Hand Project Card, Select ${selectedJobSlots.length} Job Slot`,
    getParams: ({ selectedHandProjectCards, selectedJobSlots, assignedJobName }) =>
      [selectedHandProjectCards[0], selectedJobSlots[0], assignedJobName ?? undefined],
    execute: ({ createProject }, { selectedHandProjectCards, selectedJobSlots, assignedJobName }, options) =>
      createProject(selectedHandProjectCards[0], selectedJobSlots[0], assignedJobName ?? undefined, options),
  },

  recruit: {
    displayName: 'Recruit',
    steps: [{ name: 'Select One Job Slot, Select One Project Slot' }],
    activateBoard: ({ setJobSlotsInteractive, setProjectSlotsInteractive }) => {
      setJobSlotsInteractive();
      setProjectSlotsInteractive();
    },
    isStepValid: ({ selectedJobSlots, selectedProjectSlots }) =>
      selectedJobSlots.length === 1 && selectedProjectSlots.length === 1,
    progressMessage: ({ selectedJobSlots, selectedProjectSlots }) =>
      `Select ${selectedJobSlots.length} Job Slot, Select ${selectedProjectSlots.length} Project Slot`,
    getParams: ({ selectedJobSlots, selectedProjectSlots, assignedJobName }) =>
      [selectedJobSlots[0], selectedProjectSlots[0], assignedJobName ?? undefined],
    execute: ({ recruit }, { selectedJobSlots, selectedProjectSlots, assignedJobName }, options) =>
      recruit(selectedJobSlots[0], selectedProjectSlots[0], assignedJobName ?? undefined, options),
  },

  contributeOwnedProjects: {
    displayName: 'Contribute (Own)',
    steps: [{ name: 'Contribute to Owned Projects' }],
    activateBoard: ({ setOwnedContributionInteractive }) => {
      setOwnedContributionInteractive();
    },
    isStepValid: ({ totalContributionValue, getMaxContributionValue }) => {
      const max = getMaxContributionValue('contributeOwnedProjects');
      return totalContributionValue > 0 && totalContributionValue <= max;
    },
    progressMessage: ({ totalContributionValue, getMaxContributionValue }) =>
      `Contribute ${totalContributionValue} / ${getMaxContributionValue('contributeOwnedProjects')} to Owned Projects`,
    getParams: ({ contributions }) => [contributions],
    execute: ({ contributeOwnedProjects }, { contributions }, options) =>
      contributeOwnedProjects(contributions, options),
  },

  contributeJoinedProjects: {
    displayName: 'Contribute (Joined)',
    steps: [{ name: 'Contribute to Joined Projects' }],
    activateBoard: ({ setJoinedContributionInteractive }) => {
      setJoinedContributionInteractive();
    },
    isStepValid: ({ totalContributionValue, getMaxContributionValue }) => {
      const max = getMaxContributionValue('contributeJoinedProjects');
      return totalContributionValue > 0 && totalContributionValue <= max;
    },
    progressMessage: ({ totalContributionValue, getMaxContributionValue }) =>
      `Contribute ${totalContributionValue} / ${getMaxContributionValue('contributeJoinedProjects')} to Joined Projects`,
    getParams: ({ contributions }) => [contributions],
    execute: ({ contributeJoinedProjects }, { contributions }, options) =>
      contributeJoinedProjects(contributions, options),
  },

  removeAndRefillJobs: {
    displayName: 'Remove & Refill Jobs',
    steps: [{ name: 'Select At Least One Job Slot' }],
    activateBoard: ({ setJobSlotsInteractive }) => {
      setJobSlotsInteractive();
    },
    isStepValid: ({ selectedJobSlots }) => selectedJobSlots.length > 0,
    progressMessage: ({ selectedJobSlots }) => `Select ${selectedJobSlots.length} Job Slot`,
    getParams: ({ selectedJobSlots }) => [selectedJobSlots],
    execute: ({ removeAndRefillJobs }, { selectedJobSlots }, options) =>
      removeAndRefillJobs(selectedJobSlots, options),
  },
};
