import { GameContext } from '@/components/GameContextHelpers';
import { useRef } from 'react';
import { PlayersSelector } from '@/game/store/slice/players';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { isHandProjectCardsInteractive } from '@/lib/reducers/actionStepSlice';
import {
  getSelectedHandProjectCards,
  resetHandProjectCardSelection,
  toggleHandProjectCardSelection,
} from '@/lib/reducers/handProjectCardSlice';
import ProjectCardFace from './ProjectCardFace';
import { useStartProjectSession } from './useStartProject';
import { useStartProjectReorder } from './useStartProjectReorder';

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
  const { G, playerID } = gameContext;
  const dispatch = useAppDispatch();
  const handInteractive = useAppSelector(isHandProjectCardsInteractive);
  const selectedCards = useAppSelector(getSelectedHandProjectCards);
  const start = useStartProjectSession();
  const railRef = useRef<HTMLElement>(null);
  useStartProjectReorder(railRef, '.hand-row__item', start?.picks.jobId ?? null, !!start);

  if (playerID === null) return null;
  const hand = start?.view.hand ?? PlayersSelector.getProjectCards(G.players, playerID).map((card) => ({
    card, tier: undefined,
  }));

  const handleTap = (cardId: string) => {
    if (start) {
      start.pick('project', cardId);
    } else if (handInteractive) {
      // Single-select: create (normal or overtime) plays exactly one card.
      if (!selectedCards[cardId]) dispatch(resetHandProjectCardSelection());
      dispatch(toggleHandProjectCardSelection(cardId));
    }
  };

  const strip = layout === 'strip';

  return (
    <section
      ref={railRef}
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
          {hand.map(({ card, tier }) => (
            <div key={card.id} data-start-id={card.id} className="hand-row__item">
              <ProjectCardFace
                card={card}
                data-testid={`hand-card-${card.id}`}
                selected={start ? start.picks.projectId === card.id : handInteractive && !!selectedCards[card.id]}
                onClick={start || handInteractive ? () => handleTap(card.id) : undefined}
                disabled={tier === 'disabled'}
                visualState={start?.picks.jobId && tier !== 'disabled' && start.picks.projectId !== card.id ? 'generalHint' : undefined}
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
