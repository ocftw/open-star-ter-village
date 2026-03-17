import { ActionMoveName, ActionMoves } from '@/game/core/stage/action/move/type';
import { ContributionAction } from '@/game/core/ContributionAction';

/** Actions that mirror is allowed to repeat. Defined before ActionSelectionState so it can reference it. */
export type MirrorableActionName = Exclude<ActionMoveName, 'mirror'>;

/** Selection data from the Redux store available to every action config. */
export interface ActionSelectionState {
  selectedHandProjectCards: string[];
  selectedJobSlots: string[];
  selectedProjectSlots: string[];
  contributions: ContributionAction[];
  totalContributionValue: number;
  getMaxContributionValue: (name: MirrorableActionName) => number;
}

/** Redux dispatch functions that make board elements interactive. */
export interface ActionBoardActivators {
  setHandPorjectCardsInteractive: () => void;
  setJobSlotsInteractive: () => void;
  setProjectSlotsInteractive: () => void;
  setOwnedContributionInteractive: () => void;
  setJoinedContributionInteractive: () => void;
}

/** boardgame.io move functions for the 5 mirrorable actions. */
export type ActionExecutors = Omit<ActionMoves, 'mirror'>;

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
  /** Arguments to pass to the boardgame.io move (or to onMirror). */
  getParams(state: ActionSelectionState): unknown[];
  /** Dispatch the actual boardgame.io move. */
  execute(executors: ActionExecutors, state: ActionSelectionState): void;
}

export const ACTION_CONFIGS: Record<MirrorableActionName, ActionConfig> = {
  createProject: {
    displayName: 'Create Project',
    steps: [{ name: 'Select One Hand Project Card, Select One Job Slot' }],
    activateBoard: ({ setHandPorjectCardsInteractive, setJobSlotsInteractive }) => {
      setHandPorjectCardsInteractive();
      setJobSlotsInteractive();
    },
    isStepValid: ({ selectedHandProjectCards, selectedJobSlots }) =>
      selectedHandProjectCards.length === 1 && selectedJobSlots.length === 1,
    progressMessage: ({ selectedHandProjectCards, selectedJobSlots }) =>
      `Select ${selectedHandProjectCards.length} Hand Project Card, Select ${selectedJobSlots.length} Job Slot`,
    getParams: ({ selectedHandProjectCards, selectedJobSlots }) =>
      [selectedHandProjectCards[0], selectedJobSlots[0]],
    execute: ({ createProject }, { selectedHandProjectCards, selectedJobSlots }) =>
      createProject(selectedHandProjectCards[0], selectedJobSlots[0]),
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
    getParams: ({ selectedJobSlots, selectedProjectSlots }) =>
      [selectedJobSlots[0], selectedProjectSlots[0]],
    execute: ({ recruit }, { selectedJobSlots, selectedProjectSlots }) =>
      recruit(selectedJobSlots[0], selectedProjectSlots[0]),
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
    execute: ({ contributeOwnedProjects }, { contributions }) =>
      contributeOwnedProjects(contributions),
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
    execute: ({ contributeJoinedProjects }, { contributions }) =>
      contributeJoinedProjects(contributions),
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
    execute: ({ removeAndRefillJobs }, { selectedJobSlots }) =>
      removeAndRefillJobs(selectedJobSlots),
  },
};
