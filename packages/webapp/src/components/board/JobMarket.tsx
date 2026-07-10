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
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import JobTile from './JobTile';

/**
 * Job market grid + the two board affordances of the redesign:
 * tapping the deck refills (removeAndRefillJobs), the 加班 slot mirrors.
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
  const { G } = gameContext;
  const dispatch = useAppDispatch();
  const jobsInteractive = useAppSelector(isJobSlotsInteractive);
  const selectedSlots = useAppSelector(getSelectedJobSlots);
  const currentAction = useAppSelector(getCurrentAction);

  const multiSelect = currentAction === UserActionMoves.RemoveAndRefillJobs || discardActive;
  const mirrorOccupied = ActionSlotSelector.isOccupied(G.table.actionSlots.mirror);

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
            <button
              type="button"
              data-testid="mirror-slot"
              className="btn-sticker sm ghost"
              onClick={() => dispatch(setCurrentAction(UserActionMoves.Mirror))}
              style={mirrorOccupied ? { opacity: 0.45 } : undefined}
              title={mirrorOccupied ? '加班本輪已被使用' : '重複一個已被使用的行動'}
            >
              ⏰ 加班 <span className="tag-en">Mirror</span>
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
        {G.table.jobSlots.map((job) => (
          <JobTile
            key={job.id}
            id={job.id}
            name={job.name}
            selected={jobsInteractive && !!selectedSlots[job.id]}
            onClick={idle || jobsInteractive ? () => handleTap(job.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
