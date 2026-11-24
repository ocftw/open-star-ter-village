import React from 'react';
import { GameContext } from '@/components/GameContextHelpers';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  UserActionMoves,
  getCurrentAction,
  isJobSlotsInteractive,
  setCurrentAction,
} from '@/lib/reducers/actionStepSlice';
import {
  getSelectedJobSlots,
  resetJobSlotSelection,
  toggleJobSlotSelection,
} from '@/lib/reducers/jobSlotSlice';
import { Button, PLAYER_COLORS, Toast } from '@/components/design';
import { RuleSelector } from '@/game/store/slice/rule';
import { getPlayerName } from '@/components/playerNameMap';
import { getNumRealJobSlots, isLiveSlashWildJobCard, isSlashWildJobCard } from '@/game/core/slashWildJob';
import JobTile from './JobTile';
import MarketCarousel from './MarketCarousel';
import { canSelectAction, remainingActionUses } from './actionPanel';
import { useRefillFlow } from './RefillFlow';
import { REFILL_TIMING } from './refillFlowModel';
import { useStartProjectSession } from './useStartProject';
import { useStartProjectReorder } from './useStartProjectReorder';

/** Local shrink of a just-removed OLD card before its ghost appears (ms). */
const SHRINK_MS = 260;
/** Room kept right of the landing slot for the carousel's › button and fade. */
const DEAL_EDGE_ROOM = 56;

/**
 * Shared job market: player badges, a persistent refill pill and a one-row carousel; cards become selectable after an action is chosen.
 */
export default function JobMarket({
  gameContext,
  idle,
  discardActive,
}: {
  gameContext: GameContext;
  idle: boolean;
  discardActive: boolean;
}) {
  const { G, ctx, playerID, matchData } = gameContext;
  const dispatch = useAppDispatch();
  const jobsInteractive = useAppSelector(isJobSlotsInteractive);
  const selectedSlots = useAppSelector(getSelectedJobSlots);
  const currentAction = useAppSelector(getCurrentAction);

  const refillMode = jobsInteractive && currentAction === UserActionMoves.RemoveAndRefillJobs;
  const discardMode = jobsInteractive && discardActive;
  const removeMode = refillMode || discardMode;
  const multiSelect = removeMode;
  const removedCount = Object.values(selectedSlots).filter(Boolean).length;
  const visibleJobs = G.table.jobSlots.filter((job) => !isSlashWildJobCard(job) ||
    (playerID === ctx.currentPlayer && isLiveSlashWildJobCard(G, ctx.currentPlayer, job)));

  const flow = useRefillFlow();
  const sectionRef = React.useRef<HTMLElement>(null);
  const start = useStartProjectSession();
  useStartProjectReorder(sectionRef, '.job-tile-wrap[data-start-id]', start?.picks.projectId ?? null, !!start && !flow.busy);

  // × shrinks the OLD identity locally, then it settles as a ghost. The tile
  // body stays inert; selection itself is dispatched immediately.
  const [shrinking, setShrinking] = React.useState<Record<string, true>>({});
  const shrinkTimers = React.useRef<number[]>([]);
  React.useEffect(() => {
    if (refillMode) return;
    shrinkTimers.current.forEach((t) => window.clearTimeout(t));
    shrinkTimers.current = [];
    setShrinking((current) => (Object.keys(current).length ? {} : current));
  }, [refillMode]);
  React.useEffect(() => () => shrinkTimers.current.forEach((t) => window.clearTimeout(t)), []);

  const handleRefillRemove = (id: string) => {
    // Hand focus to the next live × (or CANCEL) before this one unmounts.
    const wrap = Array.from(sectionRef.current?.querySelectorAll<HTMLElement>('.job-tile-wrap[data-job-id]') ?? [])
      .find((el) => el.dataset.jobId === id);
    let next: Element | null = wrap?.nextElementSibling ?? null;
    while (next && !next.querySelector('.job-remove')) next = next.nextElementSibling;
    const target = (next?.querySelector('.job-remove') ??
      sectionRef.current?.querySelector('[data-testid="refill-cancel"]')) as HTMLElement | null;
    dispatch(toggleJobSlotSelection(id));
    setShrinking((current) => ({ ...current, [id]: true }));
    shrinkTimers.current.push(
      window.setTimeout(() => {
        setShrinking((current) => {
          const { [id]: _done, ...rest } = current;
          return rest;
        });
      }, SHRINK_MS),
    );
    target?.focus();
  };

  const handleTap = (id: string) => {
    if (start) {
      start.pick('job', id);
    } else if (jobsInteractive) {
      if (!multiSelect && !selectedSlots[id]) dispatch(resetJobSlotSelection());
      dispatch(toggleJobSlotSelection(id));
    }
  };

  const playerIds = ctx.playOrder;
  const playerNames = playerIds.map((id) => getPlayerName(matchData, id));
  const cardCount = flow.view?.count ?? getNumRealJobSlots(G.table.jobSlots);
  const refillName = UserActionMoves.RemoveAndRefillJobs;
  const refillEnabled = idle && currentAction === null && cardCount > 0 && playerID !== null && canSelectAction(G, playerID, refillName) && !flow.busy;
  const remaining = remainingActionUses(G, refillName);
  const cost = RuleSelector.getActionTokenCost(G.rules, refillName);

  // Deal origin D (the header edge by REFILL) and the left-shift slide: DOM
  // measurement only, driven by the flow phase.
  const rectsRef = React.useRef(new Map<string, DOMRect>());
  const lastPhaseRef = React.useRef<string | null>(null);
  const phase = flow.view?.phase ?? null;
  React.useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const wraps = Array.from(section.querySelectorAll<HTMLElement>('.job-tile-wrap[data-job-id]'));
    const next = new Map<string, DOMRect>();
    wraps.forEach((el) => next.set(el.dataset.jobId!, el.getBoundingClientRect()));
    if (phase === 'shifting' && lastPhaseRef.current !== 'shifting') {
      const wildId = G.table.jobSlots.find(isSlashWildJobCard)?.id;
      wraps.forEach((el) => {
        if (el.dataset.jobId === wildId) return;
        const before = rectsRef.current.get(el.dataset.jobId!);
        const after = next.get(el.dataset.jobId!);
        if (!before || !after || typeof el.animate !== 'function') return;
        const dx = before.left - after.left;
        if (Math.abs(dx) > 0.5) {
          el.animate(
            [{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }],
            { duration: REFILL_TIMING.shift - 40, easing: 'cubic-bezier(0.3, 0.7, 0.3, 1)' },
          );
        }
      });
    }
    const origin = section.querySelector('[data-testid="job-market-actions"]')?.getBoundingClientRect();
    wraps.filter((el) => el.dataset.motion === 'deal').forEach((el) => {
      // Bring the landing slot into view first (instant: the flight is the motion).
      const row = el.parentElement;
      if (row) {
        const needed = el.offsetLeft + el.offsetWidth + DEAL_EDGE_ROOM - row.clientWidth;
        if (needed > row.scrollLeft) row.scrollLeft = needed;
      }
      // Measure the slot without the animation's own transform.
      el.style.animation = 'none';
      const rect = el.getBoundingClientRect();
      el.style.animation = '';
      if (origin) {
        el.style.setProperty('--deal-from-x', `${Math.round(origin.right - rect.right)}px`);
        el.style.setProperty('--deal-from-y', `${Math.round(origin.top - rect.top)}px`);
      }
    });
    lastPhaseRef.current = phase;
    rectsRef.current = next;
  });

  // One keyed list for both paths, so cards that stay on the table are never
  // remounted when a refill sequence hands the row back to G.
  const rows = flow.view ? flow.view.tiles.map((tile) =>
    tile.kind === 'empty' ? (
      <div key={tile.key} className="job-slot-empty" data-testid="job-slot-empty" aria-hidden="true" />
    ) : (
      <JobTile
        key={tile.id}
        id={tile.id}
        name={tile.name}
        visualState={tile.ghost ? 'ghost' : undefined}
        motion={tile.motion}
        motionDelay={tile.delay}
        onClick={jobsInteractive && !tile.ghost ? () => handleTap(tile.id) : undefined}
      />
    ),
  ) : (start?.view.market ?? visibleJobs.map((card) => ({ card, tier: undefined }))).map(({ card: job, tier }) => {
      const removed = !!selectedSlots[job.id];
      if (removeMode) {
        // 四大自由 discard: marked tiles leave the row (prototype); the
        // × disappears once 2 are marked. Refill: removed tiles stay as ghosts.
        if (discardMode && removed) return null;
        // The 斜槓青年 wild card is turn-only and can be neither replaced nor discarded.
        const canRemove = !removed && !(discardMode && removedCount >= 2) && !isSlashWildJobCard(job);
        const settling = refillMode && removed && !!shrinking[job.id];
        return (
          <JobTile
            key={job.id}
            id={job.id}
            name={job.name}
            visualState={removed && !settling ? 'ghost' : 'change'}
            shrinking={settling}
            onRemove={canRemove ? () => (refillMode ? handleRefillRemove(job.id) : handleTap(job.id)) : undefined}
          />
        );
      }
      return (
        <JobTile
          key={job.id}
          id={job.id}
          name={job.name}
          selected={start ? start.picks.jobId === job.id : jobsInteractive && removed}
          visualState={tier === 'disabled' ? 'disabled' :
            start?.picks.projectId && start.picks.jobId !== job.id ? 'generalHint' : undefined}
          onClick={start || jobsInteractive ? () => handleTap(job.id) : undefined}
        />
      );
    });

  return (
    <section ref={sectionRef} className="job-market" aria-label="人力市場" data-testid="job-market" data-refill-phase={phase ?? undefined}>
      <header className="job-market__head">
        <div className="job-market__title">
          <div className="job-market__title-line">
            <h2 className="job-market__heading">人力市場</h2>
            <span
              className="job-market__players"
              role="img"
              aria-label={`共用人力市場：${playerNames.join('、')}`}
              data-testid="job-market-players"
            >
              {playerIds.map((id, index) => (
                <span
                  key={id}
                  className="job-market__pdot"
                  style={{ background: PLAYER_COLORS[Number(id) % PLAYER_COLORS.length] }}
                  aria-hidden="true"
                >
                  {playerNames[index][0]}
                </span>
              ))}
            </span>
          </div>
          <span className="job-market__count" data-testid="job-market-count" data-count={cardCount}>
            JOB MARKET · {cardCount} CARDS
          </span>
        </div>
        <div className="job-market__actions" data-testid="job-market-actions">
          {playerID !== null && (
            <Button
              variant="sec"
              className="gr-panel-action job-market__refill"
              data-testid="refill-jobs"
              aria-pressed={currentAction === refillName}
              disabled={!refillEnabled}
              onClick={() => dispatch(setCurrentAction(refillName))}
            >
              <span className="gr-panel-action__cost" aria-label={`COST ${cost}`}>
                <span>COST</span>
                <strong>{cost}</strong>
              </span>
              <span className="gr-panel-action__label">
                <strong>換人力</strong>
                <span className="gr-panel-action__en">REFILL</span>
                <span className="gr-action-panel__dots" aria-label={`換人力本回合剩餘 ${remaining} 次`} data-remaining-uses={remaining}>
                  <span className="gr-action-panel__dot" data-remaining={remaining > 0} aria-hidden="true" />
                </span>
              </span>
            </Button>
          )}
        </div>
      </header>
      {refillMode && (
        <p className="job-market__hint" data-testid="refill-hint">
          點人力卡右上角的 × 換掉，換好後按「確認人力」。
        </p>
      )}
      <div className="job-market__score" role="status" aria-live="polite">
        {flow.popup && (
          <span key={flow.popup.key} className="job-market__score-popup" data-testid="score-popup">
            影響力+{flow.popup.amount}
          </span>
        )}
      </div>
      <Toast
        className="job-market__toast"
        open={flow.toastKey !== null}
        resetKey={flow.toastKey ?? undefined}
        onClose={flow.closeToast}
      >
        已更換成新人力
      </Toast>
      <MarketCarousel label="人力市場" resetKey={currentAction}>
        {rows}
      </MarketCarousel>
    </section>
  );
}
