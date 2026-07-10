import React, { useEffect } from 'react';
import { GameContext } from '@/components/GameContextHelpers';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  UserActionMoves,
  getCurrentAction,
  getCurrentStep,
  getMirrorTarget,
  resetAction,
  setActionStep,
  setCurrentAction,
  setMirrorTarget,
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
import { ActionMoves } from '@/game/core/stage/action/move/type';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersSelector } from '@/game/store/slice/players';
import {
  ACTION_CONFIGS,
  ActionBoardActivators,
  ActionExecutors,
  ActionSelectionState,
  MirrorableActionName,
} from './actionConfig';

type ExtendedMoves = ActionMoves & { endActionTurn: () => void };

const MIRRORABLE_NAMES: MirrorableActionName[] = [
  'createProject',
  'recruit',
  'contributeOwnedProjects',
  'contributeJoinedProjects',
  'removeAndRefillJobs',
];

const MIRROR_LABELS: Record<MirrorableActionName, string> = {
  createProject: '發起專案',
  recruit: '招募人力',
  contributeOwnedProjects: '貢獻自有專案',
  contributeJoinedProjects: '貢獻參與專案',
  removeAndRefillJobs: '換人力市場',
};

type ModeCopy = {
  icon: string;
  title: string;
  en: string;
  hint: string;
  tone: string;
  cta: string | null;
};

/**
 * The contextual action bar (design: ContextAction) — the single home for
 * confirming card-driven actions. Replaces ActionBar + ActionStepper.
 */
export default function ContextAction({ gameContext }: { gameContext: GameContext }) {
  const { G, ctx, moves, playerID } = gameContext;
  const typedMoves = moves as unknown as ExtendedMoves;
  const dispatch = useAppDispatch();

  const currentAction = useAppSelector(getCurrentAction);
  const currentStep = useAppSelector(getCurrentStep);
  const mirrorTarget = useAppSelector(getMirrorTarget);
  const handSelection = useAppSelector(getSelectedHandProjectCards);
  const jobSelection = useAppSelector(getSelectedJobSlots);
  const projectSelection = useAppSelector(getSelectedProjectSlots);
  const contributions = useAppSelector(getContributions);

  const selectionState: ActionSelectionState = {
    selectedHandProjectCards: Object.keys(handSelection).filter((id) => handSelection[id]),
    selectedJobSlots: Object.keys(jobSelection).filter((id) => jobSelection[id]),
    selectedProjectSlots: Object.keys(projectSelection).filter((id) => projectSelection[id]),
    contributions,
    totalContributionValue: getTotalContributionValue(contributions),
    getMaxContributionValue: (name) => RuleSelector.getMaxContributionValue(G.rules, name),
  };

  const resetSelections = React.useCallback(() => {
    dispatch(resetHandProjectCardSelection());
    dispatch(resetJobSlotSelection());
    dispatch(resetProjectSlotSelection());
    dispatch(resetContribution());
  }, [dispatch]);

  // Entering an action (or a mirror target) enables the matching board elements;
  // leaving it clears all selections. Ported unchanged from the old ActionStepper.
  useEffect(() => {
    const activators: ActionBoardActivators = {
      setHandProjectCardsInteractive: () => dispatch(setHandProjectCardsInteractive()),
      setJobSlotsInteractive: () => dispatch(setJobSlotsInteractive()),
      setProjectSlotsInteractive: () => dispatch(setProjectSlotsInteractive()),
      setOwnedContributionInteractive: () => dispatch(setOwnedContributionInteractive()),
      setJoinedContributionInteractive: () => dispatch(setJoinedContributionInteractive()),
    };
    if (!currentAction) {
      resetSelections();
      return;
    }
    if (currentAction === UserActionMoves.Mirror) {
      if (currentStep === 1 && mirrorTarget) {
        ACTION_CONFIGS[mirrorTarget].activateBoard(activators);
      }
    } else if (currentAction !== UserActionMoves.EndActionTurn) {
      ACTION_CONFIGS[currentAction as MirrorableActionName].activateBoard(activators);
    }
    return () => {
      resetSelections();
    };
  }, [currentAction, currentStep, mirrorTarget, dispatch, resetSelections]);

  if (playerID === null) return null;

  const actionTokens = PlayersSelector.getNumActionTokens(G.players, playerID);
  const isMyTurn = playerID === ctx.currentPlayer;
  if (!isMyTurn) return null;

  const isSlotOccupied = (name: MirrorableActionName) =>
    ActionSlotSelector.isOccupied(G.table.actionSlots[name]);
  const isSlotAvailable = (name: MirrorableActionName) =>
    RuleSelector.isActionSlotAvailable(G.rules, name);
  const occupiedMirrorableActions = MIRRORABLE_NAMES.filter(isSlotOccupied);

  const effectiveAction =
    currentAction === UserActionMoves.Mirror ? mirrorTarget : (currentAction as MirrorableActionName | null);
  // The tapped action's worker-placement slot is already taken (and this isn't a
  // mirror, whose whole point is repeating an occupied slot).
  const blockedByOccupancy =
    currentAction !== null &&
    currentAction !== UserActionMoves.Mirror &&
    currentAction !== UserActionMoves.EndActionTurn &&
    (isSlotOccupied(currentAction as MirrorableActionName) ||
      !isSlotAvailable(currentAction as MirrorableActionName));

  const isValid = (): boolean => {
    if (!currentAction) return false;
    if (currentAction === UserActionMoves.EndActionTurn) return true;
    if (blockedByOccupancy) return false;
    if (currentAction === UserActionMoves.Mirror) {
      if (currentStep === 0) return false;
      return mirrorTarget ? ACTION_CONFIGS[mirrorTarget].isStepValid(selectionState) : false;
    }
    return ACTION_CONFIGS[currentAction as MirrorableActionName].isStepValid(selectionState);
  };

  const handleConfirm = () => {
    if (currentAction === UserActionMoves.EndActionTurn) {
      typedMoves.endActionTurn();
    } else if (currentAction === UserActionMoves.Mirror && mirrorTarget) {
      typedMoves.mirror(mirrorTarget, ...ACTION_CONFIGS[mirrorTarget].getParams(selectionState));
    } else if (currentAction) {
      const executors: ActionExecutors = {
        createProject: typedMoves.createProject,
        recruit: typedMoves.recruit,
        contributeOwnedProjects: typedMoves.contributeOwnedProjects,
        contributeJoinedProjects: typedMoves.contributeJoinedProjects,
        removeAndRefillJobs: typedMoves.removeAndRefillJobs,
      };
      ACTION_CONFIGS[currentAction as MirrorableActionName].execute(executors, selectionState);
    }
    dispatch(resetAction());
  };

  const handleCancel = () => dispatch(resetAction());

  const pickMirrorTarget = (name: MirrorableActionName) => {
    resetSelections();
    dispatch(setMirrorTarget(name));
    dispatch(setActionStep(1));
  };

  const selectionProgress = (name: MirrorableActionName): string => {
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

  const copy = ((): ModeCopy => {
    switch (currentAction) {
      case null:
        return {
          icon: '👋',
          title: '輪到你了',
          en: 'Your turn',
          hint: '點手牌發起專案、點人力卡招募、點桌上專案貢獻；換人力與加班在市場旁。',
          tone: 'var(--orange)',
          cta: null,
        };
      case UserActionMoves.CreateProject:
        return {
          icon: '🚀',
          title: '發起這個專案？',
          en: 'Create this project',
          hint: `再點一張人力卡指派 1 名工人。${selectionProgress('createProject')}`,
          tone: 'var(--orange)',
          cta: '確認發起',
        };
      case UserActionMoves.Recruit:
        return {
          icon: '👥',
          title: '招募這位人力？',
          en: 'Recruit this worker',
          hint: `再點一個要投入的專案（你發起或已參與的）。${selectionProgress('recruit')}`,
          tone: 'var(--teal)',
          cta: '確認招募',
        };
      case UserActionMoves.ContributeOwnedProjects:
        return {
          icon: '✨',
          title: '貢獻給你的專案？',
          en: 'Contribute (own)',
          hint: `用卡片上的＋−分配貢獻值。${selectionProgress('contributeOwnedProjects')}`,
          tone: '#1f7a3a',
          cta: '確認貢獻',
        };
      case UserActionMoves.ContributeJoinedProjects:
        return {
          icon: '✨',
          title: '貢獻給參與的專案？',
          en: 'Contribute (joined)',
          hint: `用卡片上的＋−分配貢獻值。${selectionProgress('contributeJoinedProjects')}`,
          tone: '#1f7a3a',
          cta: '確認貢獻',
        };
      case UserActionMoves.RemoveAndRefillJobs:
        return {
          icon: '🔄',
          title: '換掉這些人力卡？',
          en: 'Refill job market',
          hint: `點選要移除的人力卡，會補滿新卡。${selectionProgress('removeAndRefillJobs')}`,
          tone: 'var(--job-civil)',
          cta: '確認更換',
        };
      case UserActionMoves.Mirror:
        return currentStep === 0
          ? {
              icon: '⏰',
              title: '加班：要重複哪個行動？',
              en: 'Mirror an action',
              hint: '選一個本輪已被使用過的行動。',
              tone: 'var(--job-legal)',
              cta: null,
            }
          : {
              icon: '⏰',
              title: `加班：${mirrorTarget ? MIRROR_LABELS[mirrorTarget] : ''}`,
              en: 'Mirror',
              hint: mirrorTarget ? selectionProgress(mirrorTarget) : '',
              tone: 'var(--job-legal)',
              cta: '確認加班',
            };
      case UserActionMoves.EndActionTurn:
        return {
          icon: '🏁',
          title: '結束這回合？',
          en: 'End your turn',
          hint: '剩下的行動點會被放棄。',
          tone: 'var(--ink)',
          cta: '確認結束',
        };
      default:
        return { icon: '👋', title: '', en: '', hint: '', tone: 'var(--orange)', cta: null };
    }
  })();

  return (
    <div
      data-testid="context-action"
      data-mode={currentAction ?? 'idle'}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        background: 'white',
        border: '2px solid var(--ink)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-sticker)',
        padding: '10px 16px',
        borderLeft: `8px solid ${copy.tone}`,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 44,
          height: 44,
          background: copy.tone,
          color: 'white',
          border: '1.5px solid var(--ink)',
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {copy.icon}
      </div>
      {/* flex-basis 180px: on narrow screens the text keeps a readable column
          and the AP dots + buttons wrap to the next row instead of squeezing it */}
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 15 }}>{copy.title}</strong>
          <span className="en-cap">{copy.en}</span>
          {blockedByOccupancy && (
            <span
              className="sticker"
              style={{ background: 'var(--orange-soft)', borderColor: 'var(--orange-deep)', color: 'var(--orange-deep)' }}
            >
              已佔用 · 用「加班」重複此行動
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.4 }}>
          {copy.hint}
        </div>
        {currentAction === UserActionMoves.Mirror && currentStep === 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {occupiedMirrorableActions.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                本輪還沒有可重複的行動。 No occupied action to repeat yet.
              </span>
            ) : (
              occupiedMirrorableActions.map((name) => (
                <button
                  key={name}
                  type="button"
                  data-testid={`mirror-pick-${name}`}
                  className="sticker"
                  style={{ cursor: 'pointer' }}
                  onClick={() => pickMirrorTarget(name)}
                >
                  {MIRROR_LABELS[name]}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* AP dots */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: '0 14px',
          borderLeft: '1.5px dashed var(--paper-3)',
        }}
        data-testid="ap-dots"
        data-ap={actionTokens}
      >
        <div className="en-cap">AP</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: i < actionTokens ? 'var(--orange)' : 'var(--paper-2)',
                border: '1.5px solid var(--ink)',
              }}
            />
          ))}
        </div>
      </div>

      {currentAction ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" data-testid="ca-cancel" onClick={handleCancel} className="btn-sticker sm ghost">
            取消
          </button>
          {copy.cta && (
            <button
              type="button"
              data-testid="ca-confirm"
              onClick={handleConfirm}
              disabled={!isValid()}
              className="btn-sticker sm"
              style={{ background: copy.tone }}
            >
              {copy.cta}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          data-testid="end-turn"
          className="btn-sticker sm dark"
          onClick={() => dispatch(setCurrentAction(UserActionMoves.EndActionTurn))}
        >
          結束我的回合
        </button>
      )}
    </div>
  );
}
