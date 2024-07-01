import { createSlice } from '@reduxjs/toolkit'

type ActiveEventType = 'table--event';
type ActiveProjectType = 'table--active-project';
type ActiveJobType = 'table--active-job';
type ActiveMoveType = 'table--active-move';

export type TableType = ActiveEventType | ActiveProjectType | ActiveJobType | ActiveMoveType;

type ProjectType = 'player--hand--project';
type ForceType = 'player--hand--force';

export type HandType = ProjectType | ForceType;

export type PlayerType = HandType;

export type StepType = TableType | PlayerType;

type Step = {
  type: StepType;
  value: any;
  prevValue?: any;
}

type RequiredStep = {
  type: StepType;
  limit?: number; // exactly limit, default is 1
  min?: number; // minimum limit, default is 0
  max?: number; // maximum limit, default is Inf
}

export type Page = {
  isCancellable: boolean;
  requiredSteps: Partial<Record<StepType, RequiredStep>>;
  toggledSteps: Step[];
}

type WizardState = {
  pages: Page[];
  currentPage: number;
}

const initialState: WizardState = {
  pages: [],
  currentPage: -1,
}

const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    init: (state, action) => {
      state.pages = action.payload;
      state.currentPage = 0;
    },
    clear: () => initialState,
    toggleOnStep: (state, action) => {
      state.pages[state.currentPage].toggledSteps.push(action.payload);
    },
    toggleOffStep: (state, action) => {
      const idx = state.pages[state.currentPage].toggledSteps.findIndex((step) =>
        action.payload.type === step.type
          && action.payload.value === step.value
          && action.payload.prevValue === step.prevValue);

      if (idx >= 0) {
        state.pages[state.currentPage].toggledSteps.splice(idx);
      }
    },
    nextPage: (state) => {
      state.currentPage ++;
      state.currentPage = Math.min(state.currentPage, state.pages.length);
    },
    prevPage: (state) => {
      state.currentPage --;
      state.currentPage = Math.max(0, state.currentPage);
    },
  },
});

export const wizardReducer = wizardSlice.reducer;
export const wizardActions = wizardSlice.actions;

// Wizard Selector

export const isLegitPage = (state: WizardState): boolean => state.currentPage >= 0;

export const isPageCancellable = (state: WizardState): boolean => isLegitPage(state) && state.pages[state.currentPage].isCancellable;

export const hasNextPage = (state: WizardState): boolean => isLegitPage(state) && state.currentPage < state.pages.length;

export const hasPrevPage = (state: WizardState): boolean => state.currentPage > 1;

export const getCurrentPage = (state: WizardState): Page => state.pages[state.currentPage];

// Page Selector

export const isRequiredStep = (state: Page, stepType: StepType): boolean => !!state.requiredSteps[stepType];

export const isToggledStep = (state: Page, step: Step): boolean => {
  const idx = state.toggledSteps.findIndex(toggled => step.type === toggled.type && step.value === toggled.value && step.prevValue === toggled.prevValue);
  return idx >= 0;
}

const getRequiredLimit = (required: RequiredStep) => {
  if (required.limit) {
    return {
      min: required.limit,
      max: required.limit,
    }
  }
  if (required.min || required.max) {
    return {
      min: required.min || 0,
      max: required.max || Infinity,
    }
  }
  return {
    min: 0,
    max: Infinity,
  }
}

export const isRequiredStepsFulfilled = (state: Page): boolean => {
  return Object.values(state.requiredSteps)
    .every((requiredStep) => {
      const { min, max } = getRequiredLimit(requiredStep);
      const toggled = state.toggledSteps.filter(step => step.type === requiredStep.type).length;

      return min <= toggled && toggled <= max;
    });
}
