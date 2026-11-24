import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Alert, Snackbar } from '@mui/material';
import { Button, Toast } from '@/components/design';
import { PANEL_ACTIONS, canSelectAction } from './actionPanel';
import { GameContext } from '@/components/GameContextHelpers';
import { useSnackbar } from '@/lib/useSnackbar';
import {
  ActionExecutionOptions,
  GENERIC_ACTION_ERROR_MESSAGE,
  ValidationFailure,
  ValidationResult,
  getActionErrorMessage,
  invalid,
  validateContributeJoinedProjects,
  validateContributeOwnedProjects,
  validateCreateProject,
  validateOvertime,
  validateRecruit,
  validateRemoveAndRefillJobs,
} from '@/game/core/stage/action/validate';
import { useAppDispatch, useAppSelector, useAppStore } from '@/lib/hooks';
import {
  UserActionMoves,
  getAssignedJobName,
  getCurrentAction,
  resetAction,
  setCurrentAction,
  setAssignedJobName,
  setHandProjectCardsInteractive,
  setJobSlotsInteractive,
  setProjectSlotsInteractive,
  setOwnedContributionInteractive,
  setJoinedContributionInteractive,
} from '@/lib/reducers/actionStepSlice';
import { getSelectedHandProjectCards, resetHandProjectCardSelection } from '@/lib/reducers/handProjectCardSlice';
import { getSelectedJobSlots, resetJobSlotSelection } from '@/lib/reducers/jobSlotSlice';
import { getSelectedProjectSlots, resetProjectSlotSelection } from '@/lib/reducers/projectSlotSlice';
import { getContributions, resetContribution } from '@/lib/reducers/contributionSlice';
import { ContributionAction, getTotalContributionValue } from '@/game/core/ContributionAction';
import { ActionMoveName, ActionMoves } from '@/game/core/stage/action/move/type';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersSelector } from '@/game/store/slice/players';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { useRefillFlow } from './RefillFlow';
import StartProjectFlow from './StartProjectFlow';
import { useStartProjectSession } from './useStartProject';
import { isWildPair } from './startProjectOrder';
import { useStartProjectDeparture } from './useStartProjectDeparture';
import ContributionConfirmBar from './ContributionConfirmBar';
import { isContributionAction } from './useContributionFeedback';

type ExtendedMoves = ActionMoves & { endActionTurn: () => void };
type RegularActionName = ActionMoveName;

type ModeCopy = {
  title: string;
  hint: string;
  cta: string | null;
};

/**
 * Action-first panel with the existing selection, preflight, and move dispatch flow.
 */
export default function ContextAction({
  gameContext, startMountRef, startHand, startMarket, contributionMount, onContributionSubmit, onContributionCancel,
}: {
  gameContext: GameContext;
  startMountRef?: React.RefObject<HTMLDivElement>;
  startHand?: React.ReactNode;
  startMarket?: React.ReactNode;
  contributionMount?: HTMLElement | null;
  onContributionSubmit?: (
    name: UserActionMoves.ContributeOwnedProjects | UserActionMoves.ContributeJoinedProjects,
    contributions: ContributionAction[],
  ) => void;
  onContributionCancel?: () => void;
}) {
  const { G, ctx, moves, playerID } = gameContext;
  const typedMoves = moves as unknown as ExtendedMoves;
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const currentAction = useAppSelector(getCurrentAction);
  const handSelection = useAppSelector(getSelectedHandProjectCards);
  const jobSelection = useAppSelector(getSelectedJobSlots);
  const projectSelection = useAppSelector(getSelectedProjectSlots);
  const pendingContributions = useAppSelector(getContributions);
  const contributions = pendingContributions.filter(({ value }) => value > 0);
  const assignedJobName = useAppSelector(getAssignedJobName);
  const start = useStartProjectSession();
  const startActive = currentAction === UserActionMoves.CreateProject;
  const contributionActive = isContributionAction(currentAction);
  const board = G.table.projectBoard;
  const pendingCardIds = React.useRef(new Map<string, string | undefined>());
  React.useLayoutEffect(() => {
    const previous = pendingCardIds.current;
    pendingCardIds.current = new Map(contributions.map(({ projectSlotId }) => [
      projectSlotId,
      previous.has(projectSlotId) ? previous.get(projectSlotId) : board.find(({ id }) => id === projectSlotId)?.card?.id,
    ]));
  });
  const panelRef = React.useRef<HTMLElement>(null);
  const captureDeparture = useStartProjectDeparture(gameContext);
  const wasStarting = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!startActive && wasStarting.current) {
      const startButton = panelRef.current?.querySelector<HTMLButtonElement>('[data-testid="action-createProject"]');
      if (startButton && !startButton.disabled) startButton.focus();
      else panelRef.current?.focus();
    }
    wasStarting.current = startActive;
  }, [startActive]);

  const lastContributionStepperRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    if (!contributionActive) {
      lastContributionStepperRef.current = null;
      return;
    }
    const remember = (event: FocusEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLButtonElement
        && (target.dataset.testid === 'contribution-increment' || target.dataset.testid === 'contribution-decrement')
      ) {
        lastContributionStepperRef.current = target;
      }
    };
    document.addEventListener('focusin', remember);
    return () => document.removeEventListener('focusin', remember);
  }, [contributionActive]);

  const hadPendingContribution = React.useRef(false);
  const hasPendingContribution = contributions.length > 0;
  React.useLayoutEffect(() => {
    const wasPending = hadPendingContribution.current;
    hadPendingContribution.current = hasPendingContribution;
    if (!wasPending || hasPendingContribution || !contributionActive) return;
    const last = lastContributionStepperRef.current;
    const available = last && last.isConnected && !last.disabled ? last : null;
    const sibling = last?.closest('[data-testid="contribution-controls"]')
      ?.querySelector<HTMLButtonElement>('[data-testid="contribution-increment"]:not(:disabled)');
    const firstPlus = document.querySelector<HTMLButtonElement>('[data-testid="contribution-increment"]:not(:disabled)');
    (available ?? sibling ?? firstPlus ?? panelRef.current)?.focus();
  }, [hasPendingContribution, contributionActive]);

  useEffect(() => {
    if (!startActive) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
      event.preventDefault();
      dispatch(resetAction());
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [startActive, dispatch]);

  const selectionState = {
    selectedHandProjectCards: start ? (start.picks.projectId ? [start.picks.projectId] : []) : Object.keys(handSelection).filter((id) => handSelection[id]),
    selectedJobSlots: start ? (start.picks.jobId ? [start.picks.jobId] : []) : Object.keys(jobSelection).filter((id) => jobSelection[id]),
    selectedProjectSlots: Object.keys(projectSelection).filter((id) => projectSelection[id]),
    assignedJobName: start ? start.assignedJobName : assignedJobName,
    contributions,
    totalContributionValue: getTotalContributionValue(contributions),
    getMaxContributionValue: (name: RegularActionName) => RuleSelector.getMaxContributionValue(G.rules, name),
  };

  const refillFlow = useRefillFlow();
  // 換人力 controls live in the 人力市場 header (job-market-actions); without a
  // market on the page they fall back into this panel, so there is always
  // exactly one ca-confirm.
  const [marketActions, setMarketActions] = React.useState<Element | null>(null);
  // Runs every commit on purpose (the market may mount later); it bails when unchanged.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useLayoutEffect(() => {
    const el = document.querySelector('[data-testid="job-market-actions"]');
    setMarketActions((current) => (current === el ? current : el));
  });

  const resetSelections = React.useCallback(() => {
    dispatch(resetHandProjectCardSelection());
    dispatch(resetJobSlotSelection());
    dispatch(resetProjectSlotSelection());
    dispatch(resetContribution());
  }, [dispatch]);

  // Repeating an occupied action via 加班 Overtime (F-005). Confirming keeps the
  // same currentAction and selections; the same move runs with { useOvertime }.
  const [overtime, setOvertime] = React.useState(false);
  useEffect(() => {
    setOvertime(false);
  }, [currentAction]);

  // Generic fallback for unexpected rejections: the server processes
  // moves asynchronously and INVALID_MOVE leaves state unchanged, so watch
  // ctx.numMoves after a dispatch. If it never advances, tell the player their
  // action did not happen.
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const [startRejected, setStartRejected] = React.useState(false);
  const latestMoveStateRef = React.useRef({ numMoves: ctx.numMoves ?? 0, turn: ctx.turn });
  useEffect(() => {
    latestMoveStateRef.current = { numMoves: ctx.numMoves ?? 0, turn: ctx.turn };
  });
  const watchForSilentRejection = React.useCallback(() => {
    const captured = { numMoves: ctx.numMoves ?? 0, turn: ctx.turn };
    window.setTimeout(() => {
      const latest = latestMoveStateRef.current;
      if (latest.turn === captured.turn && latest.numMoves === captured.numMoves) {
        setStartRejected(startActive);
        showSnackbar(GENERIC_ACTION_ERROR_MESSAGE, 'error');
      }
    }, 2000);
  }, [ctx.numMoves, ctx.turn, showSnackbar, startActive]);

  // Entering an action enables the matching board elements; leaving it clears
  // all selections and interactivity.
  useEffect(() => {
    if (!currentAction) {
      dispatch(resetAction());
      resetSelections();
      return;
    }
    switch (currentAction) {
      case UserActionMoves.CreateProject:
        dispatch(setHandProjectCardsInteractive());
        dispatch(setJobSlotsInteractive());
        break;
      case UserActionMoves.Recruit:
        dispatch(setJobSlotsInteractive());
        dispatch(setProjectSlotsInteractive());
        break;
      case UserActionMoves.ContributeOwnedProjects:
        dispatch(setOwnedContributionInteractive());
        break;
      case UserActionMoves.ContributeJoinedProjects:
        dispatch(setJoinedContributionInteractive());
        break;
      case UserActionMoves.RemoveAndRefillJobs:
        dispatch(setJobSlotsInteractive());
        break;
      case UserActionMoves.EndActionTurn:
        break;
    }
    return () => {
      resetSelections();
    };
  }, [currentAction, dispatch, resetSelections]);

  useEffect(() => () => {
    dispatch(resetAction());
  }, [dispatch]);

  if (playerID === null) return null;

  const actionTokens = PlayersSelector.getNumActionTokens(G.players, playerID);
  const isMyTurn = playerID === ctx.currentPlayer;
  if (!isMyTurn) return null;

  const isSlotOccupied = (name: RegularActionName) =>
    ActionSlotSelector.isOccupied(G.table.actionSlots[name]);

  const actionName =
    currentAction && currentAction !== UserActionMoves.EndActionTurn
      ? (currentAction as RegularActionName)
      : null;

  // The tapped action is disabled by the current rule set (rare).
  const ruleUnavailable = actionName !== null && !RuleSelector.isActionSlotAvailable(G.rules, actionName);
  // The tapped action's worker-placement slot is already taken this round —
  // the contextual entry point for 加班 Overtime (F-005).
  const occupied = actionName !== null && !ruleUnavailable && isSlotOccupied(actionName);

  // Overtime eligibility uses the same shared validator as the server move,
  // so the UI reason can never drift from the server rule.
  const overtimeValidation = occupied ? validateOvertime(G, playerID, actionName!) : null;
  const overtimeBlockReason: string | null =
    overtimeValidation && !overtimeValidation.valid ? getActionErrorMessage(overtimeValidation) : null;
  const canOfferOvertime = occupied && overtimeBlockReason === null;

  // Preflight validation: once the selection is complete, run the same
  // pure validators the server move will run. Failures are shown inline and
  // block the confirm button before a doomed dispatch.
  const runPreflight = (name: RegularActionName, opts?: ActionExecutionOptions): ValidationResult => {
    const s = selectionState;
    switch (name) {
      case 'createProject':
        return validateCreateProject(
          G, playerID, s.selectedHandProjectCards[0], s.selectedJobSlots[0], s.assignedJobName ?? undefined, opts,
        );
      case 'recruit':
        return validateRecruit(
          G, playerID, s.selectedJobSlots[0], s.selectedProjectSlots[0], s.assignedJobName ?? undefined, opts,
        );
      case 'contributeOwnedProjects':
      case 'contributeJoinedProjects': {
        const validate = name === 'contributeOwnedProjects' ? validateContributeOwnedProjects : validateContributeJoinedProjects;
        const result = validate(G, playerID, s.contributions, opts);
        if (!result.valid) return result;
        for (const { projectSlotId, jobName, value } of s.contributions) {
          const slot = board.find(({ id }) => id === projectSlotId);
          if (!slot?.card || (pendingCardIds.current.has(projectSlotId) &&
            pendingCardIds.current.get(projectSlotId) !== slot.card.id)) return invalid('PROJECT_SLOT_NOT_FOUND');
          const required = slot.card.requirements[jobName];
          if (!Object.hasOwn(slot.card.requirements, jobName)) return invalid('PROJECT_JOB_NOT_REQUIRED', { jobName });
          if (value > required - ProjectSlotSelector.getJobContribution(slot, jobName)) {
            return invalid('JOB_REQUIREMENT_FULFILLED', { jobName });
          }
        }
        return result;
      }
      case 'removeAndRefillJobs':
        return validateRemoveAndRefillJobs(G, playerID, s.selectedJobSlots, opts);
    }
  };

  const isSelectionComplete = (name: RegularActionName): boolean => {
    switch (name) {
      case 'createProject':
        return selectionState.selectedHandProjectCards.length === 1 && selectionState.selectedJobSlots.length === 1;
      case 'recruit':
        return selectionState.selectedJobSlots.length === 1 && selectionState.selectedProjectSlots.length === 1;
      case 'contributeOwnedProjects':
      case 'contributeJoinedProjects':
        return selectionState.totalContributionValue > 0;
      case 'removeAndRefillJobs':
        return selectionState.selectedJobSlots.length > 0;
    }
  };

  const getPreflightFailure = (): ValidationFailure | null => {
    if (!actionName || ruleUnavailable) return null;
    if (occupied && !overtime) return null; // the overtime prompt handles this state
    if (!isSelectionComplete(actionName)) return null;
    const result = runPreflight(actionName, overtime ? { useOvertime: true } : undefined);
    return result.valid ? null : result;
  };
  const preflightFailure = getPreflightFailure();

  // The board is full — creating is blocked even though the slot is free (F-003).
  const createBlockedByCapacity =
    currentAction === UserActionMoves.CreateProject &&
    G.table.projectBoard.every((slot) => slot.card);

  const isValid = (): boolean => {
    if (!currentAction || ruleUnavailable) return false;
    if (currentAction === UserActionMoves.EndActionTurn) return true;
    if (createBlockedByCapacity) return false;
    if (currentAction === UserActionMoves.RemoveAndRefillJobs && refillFlow.busy) return false;
    if (occupied && !overtime) return false;
    if (preflightFailure) return false;
    return isSelectionComplete(actionName!);
  };

  const handleConfirm = () => {
    if (contributionActive && (getCurrentAction(store.getState()) !== currentAction ||
      getContributions(store.getState()) !== pendingContributions)) return;
    if (currentAction === UserActionMoves.EndActionTurn) {
      typedMoves.endActionTurn();
      dispatch(resetAction());
      return;
    }
    if (!actionName || !isValid()) return;

    // Re-validate at click time: multiplayer state may have moved under the
    // selection. On failure keep the selection intact and explain why.
    const failure = getPreflightFailure();
    if (failure) {
      showSnackbar(getActionErrorMessage(failure), 'error');
      return;
    }

    const options = overtime ? { useOvertime: true } : undefined;
    switch (actionName) {
      case 'createProject':
        captureDeparture(selectionState.selectedHandProjectCards[0], selectionState.selectedJobSlots[0]);
        typedMoves.createProject(
          selectionState.selectedHandProjectCards[0],
          selectionState.selectedJobSlots[0],
          selectionState.assignedJobName ?? undefined,
          options,
        );
        break;
      case 'recruit':
        typedMoves.recruit(
          selectionState.selectedJobSlots[0],
          selectionState.selectedProjectSlots[0],
          selectionState.assignedJobName ?? undefined,
          options,
        );
        break;
      case 'contributeOwnedProjects':
        onContributionSubmit?.(UserActionMoves.ContributeOwnedProjects, selectionState.contributions);
        typedMoves.contributeOwnedProjects(selectionState.contributions, options);
        break;
      case 'contributeJoinedProjects':
        onContributionSubmit?.(UserActionMoves.ContributeJoinedProjects, selectionState.contributions);
        typedMoves.contributeJoinedProjects(selectionState.contributions, options);
        break;
      case 'removeAndRefillJobs':
        // Snapshot first: resetAction below clears the selection, but the
        // market keeps ghosts (and hides incoming faces) until G accepts it.
        refillFlow.begin({
          removedIds: selectionState.selectedJobSlots,
          tiles: G.table.jobSlots.map(({ id, name }) => ({ id, name })),
          apBefore: actionTokens,
          playerID,
          currentPlayer: ctx.currentPlayer,
          turn: ctx.turn,
        });
        typedMoves.removeAndRefillJobs(selectionState.selectedJobSlots, options);
        break;
    }
    watchForSilentRejection();
    dispatch(resetAction());
  };

  const handleCancel = () => dispatch(resetAction());

  const selectionProgress = (name: RegularActionName): string => {
    const s = selectionState;
    switch (name) {
      case 'recruit':
        return `已選人力 ${s.selectedJobSlots.length}/1 · 目標專案 ${s.selectedProjectSlots.length}/1`;
      case 'contributeOwnedProjects':
      case 'contributeJoinedProjects':
        return `在你有人力的職位旁按 ＋ 分配貢獻（本次 ${s.totalContributionValue}/${s.getMaxContributionValue(name)}）`;
      case 'removeAndRefillJobs':
        return `已選 ${s.selectedJobSlots.length} 張（至少 1 張）`;
      case 'createProject':
        return '';
    }
  };

  let copy = ((): ModeCopy => {
    switch (currentAction) {
      case null:
        return {
          title: '輪到你了',
          hint: '先選擇行動，再選擇卡片。換人力在市場旁。',
          cta: null,
        };
      case UserActionMoves.CreateProject:
        return {
          title: '發起專案',
          hint: '',
          cta: '確認發起',
        };
      case UserActionMoves.Recruit:
        return {
          title: '加入專案',
          hint: `選擇一張人力卡與要加入的專案。${selectionProgress('recruit')}`,
          cta: '確認加入',
        };
      case UserActionMoves.ContributeOwnedProjects:
        return {
          title: '貢獻給你的專案？',
          hint: selectionProgress('contributeOwnedProjects'),
          cta: '確認貢獻',
        };
      case UserActionMoves.ContributeJoinedProjects:
        return {
          title: '貢獻給參與的專案？',
          hint: selectionProgress('contributeJoinedProjects'),
          cta: '確認貢獻',
        };
      case UserActionMoves.RemoveAndRefillJobs:
        return {
          title: '換掉這些人力卡？',
          hint: `點人力卡右上角的 × 換掉，換好後按「確認人力」。${selectionProgress('removeAndRefillJobs')}`,
          cta: '確認人力',
        };
      case UserActionMoves.EndActionTurn:
        return {
          title: '結束這回合？',
          hint: '剩下的行動點會被放棄。',
          cta: '確認結束',
        };
      default:
        return { title: '', hint: '', cta: null };
    }
  })();
  // Contextual overrides: rule-blocked, occupied (→ overtime prompt), overtime
  // in progress, or project board full (F-003/F-005).
  const showOvertimePrompt = occupied && !overtime && canOfferOvertime;
  if (ruleUnavailable) {
    copy = { ...copy, hint: '這個行動在本局的規則下不可用。 This action is unavailable under the current rules.', cta: null };
  } else if (occupied && !overtime) {
    copy = canOfferOvertime
      ? {
          ...copy,
          title: '此行動已被使用 — 要用加班 token 重做嗎？',
          hint: `這個行動已被使用。用 1 枚加班 token 與 ${RuleSelector.getActionTokenCost(G.rules, actionName!)} AP 再做一次。`,
          cta: null,
        }
      : {
          ...copy,
          title: '此行動已被使用',
          hint: overtimeBlockReason ?? '',
          cta: null,
        };
  } else if (overtime) {
    copy = {
      ...copy,
      title: `加班：${copy.title}`,
      cta: '確認加班',
    };
  } else if (createBlockedByCapacity) {
    copy = {
      ...copy,
      hint: '專案區已滿，等專案完成釋出空位後再發起。 The project board is full — no slot for a new project.',
    };
  }

  const inMarket = currentAction === UserActionMoves.RemoveAndRefillJobs && !ruleUnavailable;
  const confirmButton = currentAction && !contributionActive && copy.cta && (
    <Button data-testid="ca-confirm" onClick={handleConfirm} disabled={!isValid()}>
      {inMarket && !overtime ? (
        <>確認人力 <span className="job-market__en">DONE</span></>
      ) : copy.cta}
    </Button>
  );
  const contributionBar = contributionActive && (
    <ContributionConfirmBar
      total={selectionState.totalContributionValue}
      max={selectionState.getMaxContributionValue(currentAction)}
      canConfirm={isValid()}
      confirmLabel={copy.cta ?? undefined}
      error={preflightFailure ? getActionErrorMessage(preflightFailure) : undefined}
      onCancel={() => {
        onContributionCancel?.();
        dispatch(resetContribution());
      }}
      onConfirm={handleConfirm}
    />
  );
  const refillControls = inMarket ? (
    <>
      <Button variant="sec" className="job-market__cancel" data-testid="refill-cancel" onClick={handleCancel}>
        取消 <span className="job-market__en">CANCEL</span>
      </Button>
      {confirmButton}
    </>
  ) : null;

  const overtimeControl = showOvertimePrompt && (
    <Button data-testid="overtime-confirm" onClick={() => setOvertime(true)}>
      加班重複 · Overtime
    </Button>
  );

  const startProjectId = selectionState.selectedHandProjectCards[0];
  const startJobId = selectionState.selectedJobSlots[0];
  const startProject = startProjectId ? PlayersSelector.getProjectCardById(G.players, playerID, startProjectId) : undefined;
  const startJob = G.table.jobSlots.find((card) => card.id === startJobId);
  const startFlow = startActive && (
    <StartProjectFlow
      cost={RuleSelector.getActionTokenCost(G.rules, 'createProject')}
      project={startProject}
      job={startJob}
      needsAssignment={isWildPair(G, playerID, { projectId: startProjectId ?? null, jobId: startJobId ?? null })}
      assignment={selectionState.assignedJobName}
      onAssign={(name) => dispatch(setAssignedJobName(name))}
      onClearProject={() => {
        if (start) start.pick('project', startProjectId);
        else {
          dispatch(resetHandProjectCardSelection());
          dispatch(setAssignedJobName(null));
        }
      }}
      onClearJob={() => {
        if (start) start.pick('job', startJobId);
        else {
          dispatch(resetJobSlotSelection());
          dispatch(setAssignedJobName(null));
        }
      }}
      hand={startHand}
      market={startMarket}
      actions={
        <>
          {(preflightFailure || copy.hint) && (
            <p role="status" data-testid={preflightFailure ? 'preflight-error' : undefined}>
              {preflightFailure ? getActionErrorMessage(preflightFailure) : copy.hint}
            </p>
          )}
          {overtimeControl}
          <Button variant="sec" data-testid="ca-cancel" onClick={handleCancel}>取消行動</Button>
          {confirmButton}
        </>
      }
    />
  );

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      className={startActive && startHand ? 'gr-action-panel gr-action-panel--start-mobile' : 'gr-action-panel'}
      aria-label="行動面板"
      data-testid="context-action"
      data-mode={currentAction ?? 'idle'}
      data-overtime={overtime || undefined}
    >
      <div className="start-project-panel-main" hidden={startActive && !!startHand}>
        <div className="gr-action-panel__ap">
          <strong>AP</strong>
          <div
            className="gr-action-panel__dots"
            data-testid="ap-dots"
            data-ap={actionTokens}
            role="img"
            aria-label={`剩餘 ${actionTokens} AP`}
          >
            {Array.from({ length: Math.max(actionTokens, RuleSelector.getPlayerMaxActionTokens(G.rules)) }, (_, i) => (
              <span key={i} className="gr-action-panel__dot" data-remaining={i < actionTokens} aria-hidden="true" />
            ))}
          </div>
        </div>
        <div className="gr-action-panel__heading">
          <h2>行動</h2>
          <span>本回合剩餘次數</span>
        </div>
        <div className="gr-action-panel__actions">
          {PANEL_ACTIONS.map(({ name, title, en }) => {
            const available = !(name === UserActionMoves.CreateProject && refillFlow.busy) && canSelectAction(G, playerID, name);
            // The game exposes one normal slot per action, not the mockup's two-use counters.
            const remaining = RuleSelector.isActionSlotAvailable(G.rules, name) && !isSlotOccupied(name) ? 1 : 0;
            const maxContribution = name === UserActionMoves.ContributeOwnedProjects || name === UserActionMoves.ContributeJoinedProjects
              ? RuleSelector.getMaxContributionValue(G.rules, name) : null;
            return (
              <Button
                key={name}
                variant="sec"
                className="gr-panel-action"
                data-testid={`action-${name}`}
                aria-pressed={currentAction === name}
                disabled={!available}
                onClick={() => {
                  if (currentAction !== name && available) {
                    dispatch(setCurrentAction(name));
                  }
                }}
              >
                <span className="gr-panel-action__cost" aria-label={`COST ${RuleSelector.getActionTokenCost(G.rules, name)}`}>
                  <span>COST</span>
                  <strong>{RuleSelector.getActionTokenCost(G.rules, name)}</strong>
                </span>
                <span className="gr-panel-action__label">
                  <strong>{title}</strong>
                  <span className="gr-panel-action__en">{en}</span>
                  <span className="gr-action-panel__dots" aria-label={`本回合剩餘 ${remaining} 次`} data-remaining-uses={remaining}>
                    <span className="gr-action-panel__dot" data-remaining={remaining > 0} aria-hidden="true" />
                  </span>
                </span>
                {maxContribution !== null && (
                  <span className="gr-panel-action__gain">
                    <strong>+{maxContribution}</strong>
                    <span>最大貢獻</span>
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {!startActive && <><div className="gr-action-panel__selection" role="status" aria-live="polite">
          {currentAction ? (
            <>
              <strong>{copy.title}</strong>
              <p>{copy.hint}</p>
              {preflightFailure && !contributionActive && (
                <p data-testid="preflight-error">{getActionErrorMessage(preflightFailure)}</p>
              )}
            </>
          ) : <p>{copy.hint}</p>}
        </div>
        {overtimeControl}
        {inMarket
          ? (marketActions ? createPortal(refillControls, marketActions) : refillControls)
          : confirmButton}
        <div className="gr-action-panel__footer">
          <Button variant="sec" data-testid="ca-cancel" onClick={handleCancel} disabled={!currentAction}>
            取消行動
          </Button>
          <Button data-testid="end-turn" onClick={() => dispatch(setCurrentAction(UserActionMoves.EndActionTurn))}>
            結束我的回合
          </Button>
        </div>
        </>}
      </div>
      {contributionMount ? createPortal(contributionBar, contributionMount) : contributionBar}
      {startMountRef?.current ? createPortal(startFlow, startMountRef.current) : startFlow}
      <Toast open={startRejected && snackbar.open} tone="alert" onClose={closeSnackbar} className="start-project__toast">
        {startRejected && snackbar.open && <span data-testid="action-error-toast">{snackbar.message}</span>}
      </Toast>
      <Snackbar
        open={!startRejected && snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar} data-testid="action-error-toast">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </section>
  );
}
