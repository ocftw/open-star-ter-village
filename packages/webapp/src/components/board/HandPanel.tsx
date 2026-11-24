import { GameContext } from '@/components/GameContextHelpers';
import { ProjectCard } from '@/game';
import { PlayersSelector } from '@/game/store/slice/players';
import { JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { isLiveSlashWildJobCard, isSlashWildJobCard, requiresAssignedJobName } from '@/game/core/slashWildJob';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  UserActionMoves,
  getAssignedJobName,
  getCurrentAction,
  isHandProjectCardsInteractive,
  setAssignedJobName,
} from '@/lib/reducers/actionStepSlice';
import { getSelectedJobSlots } from '@/lib/reducers/jobSlotSlice';
import {
  getSelectedHandProjectCards,
  resetHandProjectCardSelection,
  toggleHandProjectCardSelection,
} from '@/lib/reducers/handProjectCardSlice';
import ProjectCardFace from './ProjectCardFace';
import { ProfessionPicker } from './professionPicker';

/**
 * Your hand. `rail` = desktop bottom-row panel; `strip` = the same face at
 * 220px inside the mobile hand section. Both scroll horizontally.
 */
export default function HandPanel({
  gameContext,
  layout = 'rail',
}: {
  gameContext: GameContext;
  layout?: 'rail' | 'strip';
}) {
  const { G, ctx, playerID } = gameContext;
  const dispatch = useAppDispatch();
  const handInteractive = useAppSelector(isHandProjectCardsInteractive);
  const selectedCards = useAppSelector(getSelectedHandProjectCards);
  const currentAction = useAppSelector(getCurrentAction);
  const jobSelectionMap = useAppSelector(getSelectedJobSlots);
  const assignedJobName = useAppSelector(getAssignedJobName);

  if (playerID === null) return null;
  const hand = PlayersSelector.getProjectCards(G.players, playerID);

  // 斜槓青年 target-position picker: during Create Project, only when the
  // selected job card is the player's live wild card (legacy games: a mismatched card
  // while the entitlement is unspent), the selected hand card's requirement rows
  // become tappable targets (all positions are open on a new project).
  const selectedJobId = Object.keys(jobSelectionMap).find((id) => jobSelectionMap[id]);
  const selectedJobCard = selectedJobId
    ? JobSlotsSelector.getJobCardById(G.table.jobSlots, selectedJobId)
    : undefined;
  const professionPickerFor = (card: ProjectCard): ProfessionPicker | undefined => {
    if (currentAction !== UserActionMoves.CreateProject) return undefined;
    if (!selectedJobCard || !selectedCards[card.id]) return undefined;
    const needsProfession = isSlashWildJobCard(selectedJobCard)
      ? playerID === ctx.currentPlayer && isLiveSlashWildJobCard(G, ctx.currentPlayer, selectedJobCard)
      : requiresAssignedJobName(G.rules, playerID, selectedJobCard, Object.keys(card.requirements));
    if (!needsProfession) return undefined;
    return {
      eligibleJobNames: Object.keys(card.requirements),
      selectedJobName: assignedJobName,
      onPick: (jobName) => dispatch(setAssignedJobName(assignedJobName === jobName ? null : jobName)),
    };
  };

  const handleTap = (cardId: string) => {
    if (handInteractive) {
      // Single-select: create (normal or overtime) plays exactly one card.
      if (!selectedCards[cardId]) dispatch(resetHandProjectCardSelection());
      dispatch(toggleHandProjectCardSelection(cardId));
    }
  };

  const strip = layout === 'strip';

  return (
    <section
      aria-label="你的手牌"
      data-testid="hand-panel"
      className={`hand-panel hand-panel--${strip ? 'strip' : 'rail'}`}
    >
      <div className="hand-panel__head">
        <h2 className="hand-panel__title">你的手牌</h2>
        <span className="en-cap hand-panel__en">YOUR HAND</span>
      </div>
      {hand.length > 0 && (
        <div className="hand-row">
          {hand.map((card) => (
            <div key={card.id} className="hand-row__item">
              <ProjectCardFace
                card={card}
                data-testid={`hand-card-${card.id}`}
                selected={handInteractive && !!selectedCards[card.id]}
                onClick={handInteractive ? () => handleTap(card.id) : undefined}
                professionPicker={professionPickerFor(card)}
              />
            </div>
          ))}
        </div>
      )}
      {hand.length === 0 && (
        <div className="hand-panel__empty hatch">沒有手牌 · No cards in hand</div>
      )}
    </section>
  );
}
