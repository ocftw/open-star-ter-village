import React, { useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { Button } from '@/components/design';
import { PANEL_ACTIONS, canSelectAction } from './actionPanel';
import { GameContext } from '@/components/GameContextHelpers';
import { useSnackbar } from '@/lib/useSnackbar';
import {
  ActionExecutionOptions,
  GENERIC_ACTION_ERROR_MESSAGE,
  ValidationFailure,
  ValidationResult,
  getActionErrorMessage,
  validateContributeJoinedProjects,
  validateContributeOwnedProjects,
  validateCreateProject,
  validateOvertime,
  validateRecruit,
  validateRemoveAndRefillJobs,
} from '@/game/core/stage/action/validate';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  UserActionMoves,
  getAssignedJobName,
  getCurrentAction,
  resetAction,
  setCurrentAction,
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
import { getTotalContributionValue } from '@/game/core/ContributionAction';
import { ActionMoveName, ActionMoves } from '@/game/core/stage/action/move/type';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersSelector } from '@/game/store/slice/players';

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
export default function ContextAction({ gameContext }: { gameContext: GameContext }) {
  const { G, ctx, moves, playerID } = gameContext;
  const typedMoves = moves as unknown as ExtendedMoves;
  const dispatch = useAppDispatch();

  const currentAction = useAppSelector(getCurrentAction);
  const handSelection = useAppSelector(getSelectedHandProjectCards);
  const jobSelection = useAppSelector(getSelectedJobSlots);
  const projectSelection = useAppSelector(getSelectedProjectSlots);
  const contributions = useAppSelector(getContributions);
  const assignedJobName = useAppSelector(getAssignedJobName);

  const selectionState = {
    selectedHandProjectCards: Object.keys(handSelection).filter((id) => handSelection[id]),
    selectedJobSlots: Object.keys(jobSelection).filter((id) => jobSelection[id]),
    selectedProjectSlots: Object.keys(projectSelection).filter((id) => projectSelection[id]),
    assignedJobName,
    contributions,
    totalContributionValue: getTotalContributionValue(contributions),
    getMaxContributionValue: (name: RegularActionName) => RuleSelector.getMaxContributionValue(G.rules, name),
  };

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
  const latestMoveStateRef = React.useRef({ numMoves: ctx.numMoves ?? 0, turn: ctx.turn });
  useEffect(() => {
    latestMoveStateRef.current = { numMoves: ctx.numMoves ?? 0, turn: ctx.turn };
  });
  const watchForSilentRejection = React.useCallback(() => {
    const captured = { numMoves: ctx.numMoves ?? 0, turn: ctx.turn };
    window.setTimeout(() => {
      const latest = latestMoveStateRef.current;
      if (latest.turn === captured.turn && latest.numMoves === captured.numMoves) {
        showSnackbar(GENERIC_ACTION_ERROR_MESSAGE, 'error');
      }
    }, 2000);
  }, [ctx.numMoves, ctx.turn, showSnackbar]);

  // Entering an action enables the matching board elements; leaving it clears
  // all selections.
  useEffect(() => {
    if (!currentAction) {
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
        return validateContributeOwnedProjects(G, playerID, s.contributions, opts);
      case 'contributeJoinedProjects':
        return validateContributeJoinedProjects(G, playerID, s.contributions, opts);
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
      case 'contributeJoinedProjects': {
        const max = selectionState.getMaxContributionValue(name);
        return selectionState.totalContributionValue > 0 && selectionState.totalContributionValue <= max;
      }
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
    if (occupied && !overtime) return false;
    if (preflightFailure) return false;
    return isSelectionComplete(actionName!);
  };

  const handleConfirm = () => {
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
        typedMoves.contributeOwnedProjects(selectionState.contributions, options);
        break;
      case 'contributeJoinedProjects':
        typedMoves.contributeJoinedProjects(selectionState.contributions, options);
        break;
      case 'removeAndRefillJobs':
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
      case 'createProject':
        return `已選專案 ${s.selectedHandProjectCards.length}/1 · 指派人力 ${s.selectedJobSlots.length}/1`;
      case 'recruit':
        return `已選人力 ${s.selectedJobSlots.length}/1 · 目標專案 ${s.selectedProjectSlots.length}/1`;
      case 'contributeOwnedProjects':
      case 'contributeJoinedProjects':
        return `已分配 ${s.totalContributionValue}/${s.getMaxContributionValue(name)} 點`;
      case 'removeAndRefillJobs':
        return `已選 ${s.selectedJobSlots.length} 張（至少 1 張）`;
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
          hint: `選擇一張手牌專案與一張人力卡。${selectionProgress('createProject')}`,
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
          hint: `用卡片上的＋−分配貢獻值。${selectionProgress('contributeOwnedProjects')}`,
          cta: '確認貢獻',
        };
      case UserActionMoves.ContributeJoinedProjects:
        return {
          title: '貢獻給參與的專案？',
          hint: `用卡片上的＋−分配貢獻值。${selectionProgress('contributeJoinedProjects')}`,
          cta: '確認貢獻',
        };
      case UserActionMoves.RemoveAndRefillJobs:
        return {
          title: '換掉這些人力卡？',
          hint: `點選要移除的人力卡，會補滿新卡。${selectionProgress('removeAndRefillJobs')}`,
          cta: '確認更換',
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

  return (
    <section
      className="gr-action-panel"
      aria-label="行動面板"
      data-testid="context-action"
      data-mode={currentAction ?? 'idle'}
      data-overtime={overtime || undefined}
    >
      <div className="gr-action-panel__ap">
        <strong>AP</strong>
        <div
          className="gr-action-panel__dots"
          data-testid="ap-dots"
          data-ap={actionTokens}
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
          const available = canSelectAction(G, playerID, name);
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
                if (currentAction !== name && canSelectAction(G, playerID, name)) {
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

      <div className="gr-action-panel__selection" role="status" aria-live="polite">
        {currentAction ? (
          <>
            <strong>{copy.title}</strong>
            <p>{copy.hint}</p>
            {preflightFailure && (
              <p data-testid="preflight-error">{getActionErrorMessage(preflightFailure)}</p>
            )}
          </>
        ) : <p>{copy.hint}</p>}
      </div>
      {showOvertimePrompt && (
        <Button data-testid="overtime-confirm" onClick={() => setOvertime(true)}>
          加班重複 · Overtime
        </Button>
      )}
      {currentAction && copy.cta && (
        <Button data-testid="ca-confirm" onClick={handleConfirm} disabled={!isValid()}>
          {copy.cta}
        </Button>
      )}
      <div className="gr-action-panel__footer">
        <Button variant="sec" data-testid="ca-cancel" onClick={handleCancel} disabled={!currentAction}>
          取消行動
        </Button>
        <Button data-testid="end-turn" onClick={() => dispatch(setCurrentAction(UserActionMoves.EndActionTurn))}>
          結束我的回合
        </Button>
      </div>
      <Snackbar
        open={snackbar.open}
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
