import { GameContext } from '@/components/GameContextHelpers';
import { ProjectCard } from '@/game';
import { PlayersSelector } from '@/game/store/slice/players';
import { JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { RuleSelector } from '@/game/store/slice/rule';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  UserActionMoves,
  getAssignedJobName,
  getCurrentAction,
  isHandProjectCardsInteractive,
  setAssignedJobName,
  setCurrentAction,
} from '@/lib/reducers/actionStepSlice';
import { getSelectedJobSlots } from '@/lib/reducers/jobSlotSlice';
import {
  getSelectedHandProjectCards,
  resetHandProjectCardSelection,
  toggleHandProjectCardSelection,
} from '@/lib/reducers/handProjectCardSlice';
import EventBanner from './EventBanner';
import ProjectCardFace from './ProjectCardFace';
import { ProfessionPicker } from './professionPicker';

/**
 * Your hand. `rail` = desktop left column with the event card below;
 * `strip` = horizontal scroller inside the mobile bottom sheet.
 */
export default function HandPanel({
  gameContext,
  idle,
  layout = 'rail',
}: {
  gameContext: GameContext;
  idle: boolean;
  layout?: 'rail' | 'strip';
}) {
  const { G, playerID } = gameContext;
  const dispatch = useAppDispatch();
  const handInteractive = useAppSelector(isHandProjectCardsInteractive);
  const selectedCards = useAppSelector(getSelectedHandProjectCards);
  const currentAction = useAppSelector(getCurrentAction);
  const jobSelectionMap = useAppSelector(getSelectedJobSlots);
  const assignedJobName = useAppSelector(getAssignedJobName);

  if (playerID === null) return null;
  const hand = PlayersSelector.getProjectCards(G.players, playerID);
  const event = G.table.eventSlot;

  // 斜槓青年 target-position picker: during Create Project with a
  // mismatched job card and the event entitlement available, the selected hand
  // card's requirement rows become tappable targets (all positions are open on
  // a new project).
  const selectedJobId = Object.keys(jobSelectionMap).find((id) => jobSelectionMap[id]);
  const selectedJobCard = selectedJobId
    ? JobSlotsSelector.getJobCardById(G.table.jobSlots, selectedJobId)
    : undefined;
  const overrideAvailable = RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);
  const professionPickerFor = (card: ProjectCard): ProfessionPicker | undefined => {
    if (currentAction !== UserActionMoves.CreateProject) return undefined;
    if (!overrideAvailable || !selectedJobCard || !selectedCards[card.id]) return undefined;
    if (Object.keys(card.requirements).includes(selectedJobCard.name)) return undefined;
    return {
      eligibleJobNames: Object.keys(card.requirements),
      selectedJobName: assignedJobName,
      onPick: (jobName) => dispatch(setAssignedJobName(assignedJobName === jobName ? null : jobName)),
    };
  };

  const handleTap = (cardId: string) => {
    if (handInteractive) {
      // Single-select: create (and its mirror) plays exactly one card.
      if (!selectedCards[cardId]) dispatch(resetHandProjectCardSelection());
      dispatch(toggleHandProjectCardSelection(cardId));
    } else if (idle) {
      dispatch(setCurrentAction(UserActionMoves.CreateProject));
      dispatch(toggleHandProjectCardSelection(cardId));
    }
  };

  const strip = layout === 'strip';

  return (
    <div
      style={
        strip
          ? { display: 'flex', flexDirection: 'column', gap: 8 }
          : { display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingTop: 4 }
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 800, fontSize: strip ? 12 : 14 }}>你的手牌</span>
          {!strip && <span className="en-cap">Your hand</span>}
        </div>
        <span className="sticker" style={{ marginLeft: 'auto' }}>
          {hand.length}
        </span>
      </div>
      <div
        style={
          strip
            ? { display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }
            : { display: 'flex', flexDirection: 'column', gap: 12 }
        }
      >
        {hand.map((card) => (
          <div key={card.id} style={strip ? { flexShrink: 0, width: 210 } : undefined}>
            <ProjectCardFace
              card={card}
              data-testid={`hand-card-${card.id}`}
              selected={handInteractive && !!selectedCards[card.id]}
              onClick={idle || handInteractive ? () => handleTap(card.id) : undefined}
              professionPicker={professionPickerFor(card)}
            />
          </div>
        ))}
      </div>
      {hand.length === 0 && (
        <div
          className="hatch"
          style={{
            border: '2px dashed var(--ink-mute)',
            borderRadius: 14,
            padding: 20,
            textAlign: 'center',
            color: 'var(--ink-mute)',
            fontSize: 12,
          }}
        >
          沒有手牌 · No cards in hand
        </div>
      )}

      {event && !strip && (
        <>
          <div className="dotted" style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--ink)' }}>
              本回合事件 <span className="tag-en">This round</span>
            </div>
            <EventBanner event={event} />
          </div>
        </>
      )}
    </div>
  );
}
