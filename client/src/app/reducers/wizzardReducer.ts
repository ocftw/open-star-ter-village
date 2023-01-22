import { createReducer, createAction } from '@reduxjs/toolkit'

namespace WizzardStep {
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
  type: WizzardStep.StepType;
  value: any;
  prevValue?: any;
}

type RequiredStep = {
  type: WizzardStep.StepType;
  limit?: number; // exactly limit, default is 1
  min?: number; // minimum limit, default is 0
  max?: number; // maximum limit, default is Inf
}

type Page = {
  isCancellable: boolean;
  requiredSteps: Partial<Record<WizzardStep.StepType, RequiredStep>>;
  toggledSteps: Step[];
}

type WizzardState = {
  pages: Page[];
  currentPage: number;
}

const initialState: WizzardState = {
  pages: [],
  currentPage: -1,
}

const enum WizzardActionTypes {
  INIT_WIZZARD = 'INIT_WIZZARD',
  CLEAR_WIZZARD = 'CLEAR_WIZZARD',
  TOGGLE_ON_STEP = 'TOGGLE_ON_STEP',
  TOGGLE_OFF_STEP = 'TOGGLE_OFF_STEP',
  NEXT_PAGE = 'NEXT_PAGE',
  PREV_PAGE = 'PREV_PAGE',
}

const WizzardActions = {
  init: createAction<Page[]>(WizzardActionTypes.INIT_WIZZARD),
  clear: createAction(WizzardActionTypes.CLEAR_WIZZARD),
  toggleOnStep: createAction<Step>(WizzardActionTypes.TOGGLE_ON_STEP),
  toggleOffStep: createAction<Step>(WizzardActionTypes.TOGGLE_OFF_STEP),
  nextPage: createAction(WizzardActionTypes.NEXT_PAGE),
  prevPage: createAction(WizzardActionTypes.PREV_PAGE),
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

export const wizzardReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(WizzardActions.init, (state, action) => {
      state.pages = action.payload;
      state.currentPage = 0;
    })
    .addCase(WizzardActions.clear, () => initialState)
    .addCase(WizzardActions.toggleOnStep, (state, action) => {
      state.pages[state.currentPage].toggledSteps.push(action.payload);
    })
    .addCase(WizzardActions.toggleOffStep, (state, action) => {
      const idx = state.pages[state.currentPage].toggledSteps.findIndex((step) =>
        action.payload.type === step.type
          && action.payload.value === step.value
          && action.payload.prevValue === step.prevValue);

      if (idx >= 0) {
        state.pages[state.currentPage].toggledSteps.splice(idx);
      }
    })
    .addCase(WizzardActions.nextPage, (state) => {
      state.currentPage ++;
      state.currentPage = Math.min(state.currentPage, state.pages.length);
    })
    .addCase(WizzardActions.prevPage, (state) => {
      state.currentPage --;
      state.currentPage = Math.max(0, state.currentPage);
    })
})

// Wizzard Selector

export const isLegitPage = (state: WizzardState): boolean => state.currentPage >= 0;

export const isPageCancellable = (state: WizzardState): boolean => isLegitPage(state) && state.pages[state.currentPage].isCancellable;

export const hasNextPage = (state: WizzardState): boolean => isLegitPage(state) && state.currentPage < state.pages.length;

export const hasPrevPage = (state: WizzardState): boolean => state.currentPage > 1;

export const getCurrentPage = (state: WizzardState): Page => state.pages[state.currentPage];

// Page Selector

export const isRequiredStep = (state: Page, stepType: WizzardStep.StepType): boolean => !!state.requiredSteps[stepType];

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
 *   dispatch(WizzardActions.init(getPagesByActionName('create-project')));
 * }
 *
 * onConfirmBtnClick = () => {
 *   dispatch(WizzardActions.nextPage());
 * }
 *
 * onCancelBtnClick = () => {
 *   dispatch(WizzardActions.prevPage());
 * }
 *
 * onSubmitBtnClick = () => {
 *   dispatch(WizzardActions.clear());
 * }
 *
 * const showCancelBtn = isPageCancellable(state.wizzard);
 * const showConfirmBtn = hasNextPage(state.wizzard);
 * const showSubmitBtn = !hasNextPage(state.wizzard);
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
 *   if (name === 'create-project') {
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
 *     ]
 *   }
 * }
 *
 *
 * // Table.tsx
 *
 * const isActiveProjectSelectable = isRequiredStep(state.wizzard, 'table--active-project');
 * const isActiveJobSelectable = isRequiredStep(state.wizzard, 'table--active-job');
 * render(<>
 *   <ActiveProject isSelectable={isActiveProjectSelectable} />
 *   ......
 *   <ActiveJob isSelectable={isActiveJobSelectable} />
 * </>)
 *
 * // ActiveProject.tsx
 * // TBD: alternative seletable state injection
 * const isSelectable = isRequiredStep(state.wizzard, 'table--active-project');
 *
 * const onClick = () => {
 *   const step = { type: 'table-active-project', value: 'some-project-name' };
 *   const isToggled = isToggledStep(getCurrentPage(state.wizzard), step);
 *   if (isToggled) {
 *     dispatch(WizzardActions.toggleOffStep, step)
 *   } else {
 *     dispatch(WizzardActions.toggleOnStep, step)
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
