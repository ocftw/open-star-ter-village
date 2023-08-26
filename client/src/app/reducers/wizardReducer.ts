import { createReducer, createAction } from '@reduxjs/toolkit'

namespace WizardStep {
  namespace Table {
    type ActiveEventType = 'table--event';
    type ActiveProjectType = 'table--active-project';
    type ActiveJobType = 'table--active-job';
    type ActiveMoveType = 'table--active-move';

    export type TableType = ActiveEventType | ActiveProjectType | ActiveJobType | ActiveMoveType;
  }

  namespace Player {
    namespace Hand {
      type ProjectType = 'player--hand--project';
      type ForceType = 'player--hand--force';

      export type HandType = ProjectType | ForceType;
    }

    export type PlayerType = Hand.HandType
  }

  export type StepType = Table.TableType | Player.PlayerType
}

type Step = {
  type: WizardStep.StepType;
  value: any;
  prevValue?: any;
}

type RequiredStep = {
  type: WizardStep.StepType;
  limit?: number; // exactly limit, default is 1
  min?: number; // minimum limit, default is 0
  max?: number; // maximum limit, default is Inf
}

type Page = {
  isCancellable: boolean;
  requiredSteps: Partial<Record<WizardStep.StepType, RequiredStep>>;
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

const enum WizardActionTypes {
  INIT_WIZARD = 'INIT_WIZARD',
  CLEAR_WIZARD = 'CLEAR_WIZARD',
  TOGGLE_ON_STEP = 'TOGGLE_ON_STEP',
  TOGGLE_OFF_STEP = 'TOGGLE_OFF_STEP',
  NEXT_PAGE = 'NEXT_PAGE',
  PREV_PAGE = 'PREV_PAGE',
}

const WizardActions = {
  init: createAction<Page[]>(WizardActionTypes.INIT_WIZARD),
  clear: createAction(WizardActionTypes.CLEAR_WIZARD),
  toggleOnStep: createAction<Step>(WizardActionTypes.TOGGLE_ON_STEP),
  toggleOffStep: createAction<Step>(WizardActionTypes.TOGGLE_OFF_STEP),
  nextPage: createAction(WizardActionTypes.NEXT_PAGE),
  prevPage: createAction(WizardActionTypes.PREV_PAGE),
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

export const wizardReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(WizardActions.init, (state, action) => {
      state.pages = action.payload;
      state.currentPage = 0;
    })
    .addCase(WizardActions.clear, () => initialState)
    .addCase(WizardActions.toggleOnStep, (state, action) => {
      state.pages[state.currentPage].toggledSteps.push(action.payload);
    })
    .addCase(WizardActions.toggleOffStep, (state, action) => {
      const idx = state.pages[state.currentPage].toggledSteps.findIndex((step) =>
        action.payload.type === step.type
          && action.payload.value === step.value
          && action.payload.prevValue === step.prevValue);

      if (idx >= 0) {
        state.pages[state.currentPage].toggledSteps.splice(idx);
      }
    })
    .addCase(WizardActions.nextPage, (state) => {
      state.currentPage ++;
      state.currentPage = Math.min(state.currentPage, state.pages.length);
    })
    .addCase(WizardActions.prevPage, (state) => {
      state.currentPage --;
      state.currentPage = Math.max(0, state.currentPage);
    })
})

// Wizard Selector

export const isLegitPage = (state: WizardState): boolean => state.currentPage >= 0;

export const isPageCancellable = (state: WizardState): boolean => isLegitPage(state) && state.pages[state.currentPage].isCancellable;

export const hasNextPage = (state: WizardState): boolean => isLegitPage(state) && state.currentPage < state.pages.length;

export const hasPrevPage = (state: WizardState): boolean => state.currentPage > 1;

export const getCurrentPage = (state: WizardState): Page => state.pages[state.currentPage];

// Page Selector

export const isRequiredStep = (state: Page, stepType: WizardStep.StepType): boolean => !!state.requiredSteps[stepType];

export const isToggledStep = (state: Page, step: Step): boolean => {
  const idx = state.toggledSteps.findIndex(toggled => step.type === toggled.type && step.value === toggled.value && step.prevValue === toggled.prevValue);
  return idx >= 0;
}

export const isRequiredStepsFulfilled = (state: Page): boolean => {
  return Object.values(state.requiredSteps)
    .every((requiredStep) => {
      const { min, max } = getRequiredLimit(requiredStep);
      const toggled = state.toggledSteps.filter(step => step.type === requiredStep.type).length;

      return min <= toggled && toggled <= max;
    });
}

/**
 * // ActionBoard.tsx
 * onCreateProjectActionClick = () => {
 *   dispatch(WizardActions.init(getPagesByActionName('create-project')));
 * }
 *
 * onConfirmBtnClick = () => {
 *   dispatch(WizardActions.nextPage());
 * }
 *
 * onCancelBtnClick = () => {
 *   dispatch(WizardActions.prevPage());
 * }
 *
 * onSubmitBtnClick = () => {
 *   dispatch(WizardActions.clear());
 * }
 *
 * const showCancelBtn = isPageCancellable(state.wizard);
 * const showConfirmBtn = hasNextPage(state.wizard);
 * const showSubmitBtn = !hasNextPage(state.wizard);
 *
 * render (<>
 *   <Toolbar>
 *     {showCancelBtn && <Button onClick={onCancelBtnClick} label="Cancel" />}
 *     {showConfirmBtn && <Button onClick={onConfirmClick} label="Confirm" />}
 *     {showSubmitBtn && <Button onClick={onSubmitClick} label="Submit" />}
 *   </Toolbar
 * </>)
 *
 * const getPagesByActionName = (name) => {
 *   switch (name) {
 *     case 'create-project':
 *     return [
 *       {
 *         isCancellable: true;
 *         requiredSteps: {
 *           'player--hand--project': {
 *             type: 'player--hand--project',
 *             limit: 1,
 *           }
 *         };
 *         toggledSteps: [],
 *       },
 *       {
 *         isCancellable: true;
 *         requiredSteps: {
 *           'table--active-job': {
 *             type: 'table--active-job',
 *             limit: 1,
 *           }
 *         };
 *         toggledSteps: [],
 *       },
 *     ];
 *   }
 * }
 *
 *
 * // Table.tsx
 *
 * const isActiveProjectSelectable = isRequiredStep(state.wizard, 'table--active-project');
 * const isActiveJobSelectable = isRequiredStep(state.wizard, 'table--active-job');
 * render(<>
 *   <ActiveProject isSelectable={isActiveProjectSelectable} />
 *   ......
 *   <ActiveJob isSelectable={isActiveJobSelectable} />
 * </>)
 *
 * // ActiveProject.tsx
 * // TBD: alternative seletable state injection
 * const isSelectable = isRequiredStep(state.wizard, 'table--active-project');
 *
 * const onClick = () => {
 *   const step = { type: 'table-active-project', value: 'some-project-name' };
 *   const isToggled = isToggledStep(getCurrentPage(state.wizard), step);
 *   if (isToggled) {
 *     dispatch(WizardActions.toggleOffStep, step)
 *   } else {
 *     dispatch(WizardActions.toggleOnStep, step)
 *   }
 * }
 * render(
 *   <Box selectable={isActiveProjectSelectable} onClick={}>
 *      ......
 *   </Box>
 *
 *
 * // ActiveJob.tsx
 * // Similar to ActiveProject
 *
 * // Players.tsx
 * // TBD
 */
