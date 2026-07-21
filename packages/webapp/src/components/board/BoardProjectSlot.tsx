import React from 'react';
import { FilteredMetadata, PlayerID } from 'boardgame.io';
import { ProjectSlotState } from '@/game';
import { CharacterAvatar, getJobMetaByName, getProjectTypeMetaByName } from '@/components/design';
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

type BoardProjectSlotProps = {
  slot: ProjectSlotState;
  playerID: PlayerID | null;
  matchData?: FilteredMetadata;
  /** Called when the slot is tapped while no action is in progress (idle inference). */
  onIdleTap?: (slot: ProjectSlotState) => void;
  idle: boolean;
  /** 斜槓青年: makes eligible requirement rows tappable targets. */
  professionPicker?: ProfessionPicker;
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
  const typeMeta = getProjectTypeMetaByName(card.type);
  const isOwn = playerID !== null && slot.owner === playerID;
  const selected = slotsInteractive && !!selectedSlots[slot.id];
  // In contribute mode, only this player's worker rows on the right slots are adjustable.
  const contributionEditable =
    playerID !== null && ((ownedInteractive && isOwn) || (joinedInteractive && !isOwn));

  const handleClick = () => {
    if (slotsInteractive) {
      // Single-select: recruit (and its mirror) targets exactly one slot.
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
      data-requirements={requiredJobs.join(',')}
      data-job-requirements={JSON.stringify(card.requirements)}
      onClick={handleClick}
      style={{
        background: 'white',
        border: selected ? '2.5px solid var(--orange)' : '2px solid var(--ink)',
        borderRadius: 18,
        boxShadow: selected ? '0 4px 0 var(--orange)' : 'var(--shadow-sticker)',
        padding: '12px 12px 10px',
        cursor: clickable ? 'pointer' : 'default',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 168,
        height: '100%',
        transition: 'transform 0.12s',
        transform: selected ? 'translateY(-3px)' : 'none',
      }}
    >
      {/* corner type tab */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: 12,
          background: typeMeta?.color ?? 'var(--ink-soft)',
          color: 'white',
          padding: '2px 10px',
          borderRadius: 999,
          border: '1.5px solid var(--ink)',
          boxShadow: '0 2px 0 var(--ink)',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.04em',
        }}
      >
        {card.type}
      </div>
      {isOwn && (
        <div
          style={{
            position: 'absolute',
            top: -10,
            right: 12,
            background: 'var(--orange)',
            color: 'white',
            padding: '2px 10px',
            borderRadius: 999,
            border: '1.5px solid var(--ink)',
            boxShadow: '0 2px 0 var(--ink)',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}
        >
          YOUR PROJECT
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <span
          title={getPlayerName(matchData, slot.owner)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            background: seatColor(slot.owner),
            color: 'white',
            border: '1.5px solid var(--ink)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-en)',
            fontWeight: 800,
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {getPlayerName(matchData, slot.owner)[0]}
        </span>
        <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.15 }}>{card.name}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
          return (
            <div
              key={jobName}
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
                display: 'flex',
                alignItems: 'center',
                gap: 6,
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
                  height: 11,
                  borderRadius: 6,
                  background: 'white',
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
                      style={stepperButtonStyle}
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
                      style={stepperButtonStyle}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 'auto',
            paddingTop: 7,
            borderTop: '1.5px dashed var(--paper-3)',
          }}
        >
          <span className="tag-en">貢獻者 CONTRIBUTORS</span>
          {Object.entries(totals)
            .sort(([, a], [, b]) => b - a)
            .map(([worker, value]) => (
              <span key={worker} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: seatColor(worker),
                    color: 'white',
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
      )}
    </div>
  );
}

// Two 22px stepper buttons plus their 2px gap; reserved in every row so bars align.
const STEPPER_COLUMN_WIDTH = 46;

const stepperButtonStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 999,
  border: '1.5px solid var(--ink)',
  background: 'white',
  fontWeight: 800,
  fontSize: 13,
  lineHeight: 1,
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 1.5px 0 var(--ink)',
};
