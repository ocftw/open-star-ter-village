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
import { Button, PLAYER_COLORS } from '@/components/design';
import { RuleSelector } from '@/game/store/slice/rule';
import { getPlayerName } from '@/components/playerNameMap';
import { getNumRealJobSlots, isLiveSlashWildJobCard, isSlashWildJobCard } from '@/game/core/slashWildJob';
import JobTile from './JobTile';
import MarketCarousel from './MarketCarousel';
import { canSelectAction, remainingActionUses } from './actionPanel';

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

  const handleTap = (id: string) => {
    if (jobsInteractive) {
      if (!multiSelect && !selectedSlots[id]) dispatch(resetJobSlotSelection());
      dispatch(toggleJobSlotSelection(id));
    }
  };

  const playerIds = Object.keys(G.players);
  const playerNames = playerIds.map((id) => getPlayerName(matchData, id));
  const cardCount = getNumRealJobSlots(G.table.jobSlots);
  const refillName = UserActionMoves.RemoveAndRefillJobs;
  const refillEnabled = idle && cardCount > 0 && playerID !== null && canSelectAction(G, playerID, refillName);
  const remaining = remainingActionUses(G, refillName);
  const cost = RuleSelector.getActionTokenCost(G.rules, refillName);

  return (
    <section className="job-market" aria-label="人力市場" data-testid="job-market">
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
      <MarketCarousel label="人力市場">
        {visibleJobs.map((job) => {
          const removed = !!selectedSlots[job.id];
          if (removeMode) {
            // 四大自由 discard: marked tiles leave the row (prototype); the
            // × disappears once 2 are marked. Refill: removed tiles stay as ghosts.
            if (discardMode && removed) return null;
            // The 斜槓青年 wild card is turn-only and can be neither replaced nor discarded.
            const canRemove = !removed && !(discardMode && removedCount >= 2) && !isSlashWildJobCard(job);
            return (
              <JobTile
                key={job.id}
                id={job.id}
                name={job.name}
                visualState={removed ? 'ghost' : 'change'}
                onRemove={canRemove ? () => handleTap(job.id) : undefined}
              />
            );
          }
          return (
            <JobTile
              key={job.id}
              id={job.id}
              name={job.name}
              selected={jobsInteractive && removed}
              onClick={jobsInteractive ? () => handleTap(job.id) : undefined}
            />
          );
        })}
      </MarketCarousel>
    </section>
  );
}
