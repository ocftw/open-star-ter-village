import React from 'react';
import { FilteredMetadata, PlayerID } from 'boardgame.io';
import { ProjectSlotState } from '@/game';
import { CharacterAvatar, getJobMetaByName } from '@/components/design';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  isJoinedContributionInteractive,
  isOwnedContributionInteractive,
  isProjectSlotsInteractive,
} from '@/lib/reducers/actionStepSlice';
import {
  getSelectedProjectSlots,
  resetProjectSlotSelection,
  toggleProjectSlotSelection,
} from '@/lib/reducers/projectSlotSlice';
import { getContributions, updateContribute } from '@/lib/reducers/contributionSlice';
import { getPlayerName } from '@/components/playerNameMap';
import { ProfessionPicker } from './professionPicker';

export type ProjectCardVisualState = 'default' | 'focused' | 'generalHint' | 'jobHint';

type BoardProjectSlotProps = {
  slot: ProjectSlotState;
  playerID: PlayerID | null;
  matchData?: FilteredMetadata;
  /** Called when the slot is tapped while no action is in progress (idle inference). */
  onIdleTap?: (slot: ProjectSlotState) => void;
  idle: boolean;
  /** 斜槓青年: makes eligible requirement rows tappable targets. */
  professionPicker?: ProfessionPicker;
  /** Presentational override; otherwise the existing selection resolves to Focused. */
  visualState?: ProjectCardVisualState;
  hintJobName?: string;
};

const seatColor = (worker: PlayerID) => `var(--p${worker})`;

/** Occupied project slot on the table (design: ProjectSlot). */
export default function BoardProjectSlot({
  slot,
  playerID,
  matchData,
  onIdleTap,
  idle,
  professionPicker,
  visualState,
  hintJobName,
}: BoardProjectSlotProps) {
  const dispatch = useAppDispatch();
  const slotsInteractive = useAppSelector(isProjectSlotsInteractive);
  const ownedInteractive = useAppSelector(isOwnedContributionInteractive);
  const joinedInteractive = useAppSelector(isJoinedContributionInteractive);
  const selectedSlots = useAppSelector(getSelectedProjectSlots);
  const pendingContributions = useAppSelector(getContributions);

  // Empty slots never render as cards — the board shows a capacity indicator instead (F-003).
  if (!slot.card) return null;

  const card = slot.card;
  const isOwn = playerID !== null && slot.owner === playerID;
  const selected = slotsInteractive && !!selectedSlots[slot.id];
  const resolvedState = visualState ?? (selected ? 'focused' : 'default');
  const ownerName = getPlayerName(matchData, slot.owner);
  // In contribute mode, only this player's worker rows on the right slots are adjustable.
  const contributionEditable =
    playerID !== null && ((ownedInteractive && isOwn) || (joinedInteractive && !isOwn));

  const handleClick = () => {
    if (slotsInteractive) {
      // Single-select: recruit (normal or overtime) targets exactly one slot.
      if (!selectedSlots[slot.id]) dispatch(resetProjectSlotSelection());
      dispatch(toggleProjectSlotSelection(slot.id));
    } else if (idle && onIdleTap) {
      onIdleTap(slot);
    }
  };

  const pendingFor = (jobName: string) =>
    pendingContributions.find((c) => c.projectSlotId === slot.id && c.jobName === jobName)?.value ?? 0;

  const requiredJobs = Object.keys(card.requirements);
  const clickable = slotsInteractive || (idle && !!onIdleTap);

  // contributor legend totals (committed only). Entries whose jobName is not a
  // requirement (orphans from the pre-fix bug) are ignored defensively.
  const totals: Record<string, number> = {};
  slot.contributions.forEach((c) => {
    if (c.value > 0 && requiredJobs.includes(c.jobName)) {
      totals[c.worker] = (totals[c.worker] ?? 0) + c.value;
    }
  });

  return (
    <div
      data-testid={slot.id}
      data-visual-state={resolvedState}
      className={`project-card project-card--in-play project-card--compact project-card--${resolvedState}`}
      data-requirements={requiredJobs.join(',')}
      data-job-requirements={JSON.stringify(card.requirements)}
      style={{
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      {clickable && (
        <button
          type="button"
          className="project-card__control"
          aria-label={`${slotsInteractive ? '選擇專案' : '查看專案'} ${card.name}（${ownerName}）`}
          aria-pressed={slotsInteractive ? selected : undefined}
          onClick={handleClick}
        />
      )}
      <span className="project-card__star-pill" aria-label={`難度 ${card.difficulty}`}>
        {'★'.repeat(card.difficulty)}
      </span>

      <div className="project-card__title-row">
        <span
          className="project-card__seat"
          data-seat={slot.owner}
          title={ownerName}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            background: seatColor(slot.owner),
            border: '1.5px solid var(--ink)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-en)',
            fontWeight: 800,
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {ownerName[0]}
        </span>
        <div className="project-card__heading">
          <div className="project-card__initiator">
            <span>{ownerName}</span>
            {isOwn && <span className="project-card__own">YOUR PROJECT</span>}
          </div>
          <h3 className="project-card__title">{card.name}</h3>
        </div>
      </div>

      <div className="project-card__jobs">
        {requiredJobs.map((jobName) => {
          const need = card.requirements[jobName];
          const jobMeta = getJobMetaByName(jobName);
          const jobContributions = slot.contributions.filter((c) => c.jobName === jobName);
          const committed = jobContributions.reduce((acc, c) => acc + c.value, 0);
          const pending = pendingFor(jobName);
          const myRow = playerID !== null && jobContributions.some((c) => c.worker === playerID);
          const showStepper = contributionEditable && myRow;
          const remaining = need - committed - pending;
          // 斜槓青年 target picking: eligible rows become tap targets.
          const pickerActive = !!professionPicker;
          const pickerEligible = pickerActive && professionPicker!.eligibleJobNames.includes(jobName);
          const pickerSelected = pickerEligible && professionPicker!.selectedJobName === jobName;
          const jobHinted = resolvedState === 'jobHint' && hintJobName === jobName;
          return (
            <div
              key={jobName}
              className={`project-card__progress-row${jobHinted ? ' project-card__progress-row--hinted' : ''}`}
              data-job-hint={jobHinted ? 'true' : undefined}
              role={pickerEligible ? 'button' : undefined}
              aria-pressed={pickerEligible ? pickerSelected : undefined}
              data-testid={pickerEligible ? `profession-target-${jobName}` : undefined}
              title={
                pickerActive && !pickerEligible
                  ? '這個職業位置無法選擇（已滿或已指派）。 · Position unavailable (full or already yours).'
                  : undefined
              }
              onClick={
                pickerEligible
                  ? (e) => {
                      e.stopPropagation();
                      professionPicker!.onPick(jobName);
                    }
                  : undefined
              }
              style={{
                ...(pickerActive && {
                  borderRadius: 10,
                  padding: '2px 4px',
                  outline: pickerEligible
                    ? pickerSelected
                      ? '2px solid var(--orange)'
                      : '2px dashed var(--orange)'
                    : undefined,
                  background: pickerSelected ? 'var(--orange-soft)' : undefined,
                  cursor: pickerEligible ? 'pointer' : undefined,
                  opacity: pickerEligible ? 1 : 0.5,
                }),
              }}
            >
              {jobMeta ? (
                <CharacterAvatar role={jobMeta.role} size="sm" title={jobName} />
              ) : (
                <span style={{ fontSize: 11 }}>{jobName}</span>
              )}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 11,
                  borderRadius: 6,
                  background: '#FFFDF8',
                  border: '1.5px solid var(--ink)',
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                {jobContributions.map(
                  (c) =>
                    c.value > 0 && (
                      <div
                        key={c.worker}
                        title={`${getPlayerName(matchData, c.worker)} +${c.value}`}
                        style={{
                          width: `${(c.value / need) * 100}%`,
                          height: '100%',
                          background: seatColor(c.worker),
                          boxShadow: 'inset -1.5px 0 0 rgba(255,255,255,0.75)',
                        }}
                      />
                    ),
                )}
                {pending > 0 && (
                  <div
                    style={{
                      width: `${(pending / need) * 100}%`,
                      height: '100%',
                      background: 'repeating-linear-gradient(45deg, var(--orange) 0 4px, var(--orange-soft) 4px 8px)',
                    }}
                  />
                )}
              </div>
              {/* Fixed-width control column keeps every row's progress bar aligned */}
              <span
                className={showStepper ? 'project-card__contribution-controls' : undefined}
                data-testid="contribution-controls"
                aria-hidden={showStepper ? undefined : true}
                style={{ display: 'inline-flex', gap: 2, width: STEPPER_COLUMN_WIDTH, flexShrink: 0 }}
                onClick={showStepper ? (e) => e.stopPropagation() : undefined}
              >
                {showStepper && (
                  <>
                    <button
                      type="button"
                      aria-label={`減少 ${jobName} 貢獻`}
                      data-testid="contribution-decrement"
                      disabled={pending <= 0}
                      onClick={() =>
                        dispatch(updateContribute({ slotId: slot.id, jobName, diffAmount: pending - 1 }))
                      }
                      className="project-card__stepper"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      aria-label={`增加 ${jobName} 貢獻`}
                      data-testid="contribution-increment"
                      data-remaining={remaining}
                      disabled={remaining <= 0}
                      onClick={() =>
                        dispatch(updateContribute({ slotId: slot.id, jobName, diffAmount: pending + 1 }))
                      }
                      className="project-card__stepper"
                    >
                      ＋
                    </button>
                  </>
                )}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-en)',
                  fontSize: 11,
                  fontWeight: 800,
                  minWidth: 32,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}
              >
                {committed + pending}/{need}
              </span>
            </div>
          );
        })}
      </div>

      {Object.keys(totals).length > 0 && (
        <div className="project-card__contributors">
          <span className="project-card__contributors-label">貢獻者 CONTRIBUTORS</span>
          <div className="project-card__chips">
            {Object.entries(totals)
              .sort(([, a], [, b]) => b - a)
              .map(([worker, value]) => (
                <span
                  key={worker}
                  className="project-card__chip"
                  role="img"
                  aria-label={`${getPlayerName(matchData, worker)} 貢獻 ${value}`}
                  title={getPlayerName(matchData, worker)}
                >
                  <span
                    className="project-card__seat"
                    data-seat={worker}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      background: seatColor(worker),
                      border: '1.5px solid var(--ink)',
                      fontFamily: 'var(--font-en)',
                      fontSize: 8,
                      fontWeight: 800,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {getPlayerName(matchData, worker)[0]}
                  </span>
                  <strong style={{ fontFamily: 'var(--font-en)', fontSize: 11 }}>{value}</strong>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Two 22px stepper buttons plus their 2px gap; reserved in every row so bars align.
const STEPPER_COLUMN_WIDTH = 46;
