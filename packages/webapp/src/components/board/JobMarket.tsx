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
import { RuleSelector } from '@/game/store/slice/rule';
import { PlayersSelector } from '@/game/store/slice/players';
import { ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { getSelectedHandProjectCards } from '@/lib/reducers/handProjectCardSlice';
import { getSelectedProjectSlots } from '@/lib/reducers/projectSlotSlice';
import JobTile from './JobTile';
import { isJobEligible, JobEligibilityContext } from './jobEligibility';
import { useJobMarketMotion } from './useJobMarketMotion';

/**
 * Job market grid + the refill affordance of the redesign. 加班 Overtime is
 * entered contextually by re-tapping an occupied action; its per-player token
 * indicator lives in ContextAction next to the AP dots.
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
  const { G, playerID } = gameContext;
  const dispatch = useAppDispatch();
  const jobsInteractive = useAppSelector(isJobSlotsInteractive);
  const selectedSlots = useAppSelector(getSelectedJobSlots);
  const currentAction = useAppSelector(getCurrentAction);
  const selectedHandCards = useAppSelector(getSelectedHandProjectCards);
  const selectedProjectSlots = useAppSelector(getSelectedProjectSlots);

  const refillMode = jobsInteractive && currentAction === UserActionMoves.RemoveAndRefillJobs;
  const discardMode = jobsInteractive && discardActive;
  const removeMode = refillMode || discardMode;
  const multiSelect = removeMode;
  const removedCount = Object.values(selectedSlots).filter(Boolean).length;

  // START / JOIN: once a project is picked, jobs it cannot use are disabled
  // (prototype .jtile.disabled). Selected tiles stay enabled so they can be unpicked.
  const override = playerID !== null && RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);
  let eligibility: JobEligibilityContext | undefined;
  if (jobsInteractive && playerID !== null && !removeMode) {
    if (currentAction === UserActionMoves.CreateProject) {
      const cardId = Object.keys(selectedHandCards).find((id) => selectedHandCards[id]);
      eligibility = {
        action: 'createProject',
        card: cardId ? PlayersSelector.getProjectCardById(G.players, playerID, cardId) : undefined,
        override,
      };
    } else if (currentAction === UserActionMoves.Recruit) {
      const slotId = Object.keys(selectedProjectSlots).find((id) => selectedProjectSlots[id]);
      eligibility = {
        action: 'recruit',
        slot: slotId ? ProjectBoardSelector.getBySlotId(G.table.projectBoard, slotId) : undefined,
        playerID,
        override,
      };
    }
  }

  // 四大自由: marked tiles leave the row; refill: removed tiles stay as ghosts.
  const visibleJobs = G.table.jobSlots.filter((job) => !(discardMode && selectedSlots[job.id]));
  const ghostIds = new Set(refillMode ? visibleJobs.filter((j) => selectedSlots[j.id]).map((j) => j.id) : []);
  const rows = useJobMarketMotion(visibleJobs, ghostIds);

  const handleTap = (id: string) => {
    if (jobsInteractive) {
      if (!multiSelect && !selectedSlots[id]) dispatch(resetJobSlotSelection());
      dispatch(toggleJobSlotSelection(id));
    } else if (idle) {
      dispatch(setCurrentAction(UserActionMoves.Recruit));
      dispatch(toggleJobSlotSelection(id));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 800, fontSize: 14 }}>人力市場</span>
          <span className="en-cap">Job market · {G.table.jobSlots.length} cards</span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: 'var(--ink-mute)',
            background: 'white',
            border: '1.5px solid var(--paper-3)',
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          ⓘ 點人力卡招募到你的專案
        </span>
        {idle && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              type="button"
              data-testid="refill-jobs"
              className="btn-sticker sm ghost"
              onClick={() => dispatch(setCurrentAction(UserActionMoves.RemoveAndRefillJobs))}
            >
              🔄 換人力 <span className="tag-en">Refill</span>
            </button>
          </div>
        )}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 10,
          marginTop: 10,
        }}
      >
        {rows.map(({ job, motion, delay }) => {
          if (motion === 'drop-out') {
            return <JobTile key={job.id} id={job.id} name={job.name} motion={motion} motionDelay={delay} />;
          }
          const removed = !!selectedSlots[job.id];
          if (removeMode) {
            // The × disappears once 2 are marked (discard).
            const canRemove = !removed && !(discardMode && removedCount >= 2);
            return (
              <JobTile
                key={job.id}
                id={job.id}
                name={job.name}
                visualState={removed ? 'ghost' : 'change'}
                motion={motion}
                motionDelay={delay}
                onRemove={canRemove ? () => handleTap(job.id) : undefined}
              />
            );
          }
          const disabled = !!eligibility && !removed && !isJobEligible(job.name, eligibility);
          return (
            <JobTile
              key={job.id}
              id={job.id}
              name={job.name}
              selected={jobsInteractive && removed}
              visualState={disabled ? 'disabled' : undefined}
              motion={motion}
              motionDelay={delay}
              onClick={!disabled && (idle || jobsInteractive) ? () => handleTap(job.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
