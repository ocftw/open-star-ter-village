import { GameContext } from '@/components/GameContextHelpers';
import { PlayersSelector } from '@/game/store/slice/players';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { UserActionMoves, isHandProjectCardsInteractive, setCurrentAction } from '@/lib/reducers/actionStepSlice';
import {
  getSelectedHandProjectCards,
  resetHandProjectCardSelection,
  toggleHandProjectCardSelection,
} from '@/lib/reducers/handProjectCardSlice';
import EventBanner from './EventBanner';
import ProjectCardFace from './ProjectCardFace';

/** Left rail: your hand + this round's event (design: BoardVariantA left column). */
export default function HandPanel({ gameContext, idle }: { gameContext: GameContext; idle: boolean }) {
  const { G, playerID } = gameContext;
  const dispatch = useAppDispatch();
  const handInteractive = useAppSelector(isHandProjectCardsInteractive);
  const selectedCards = useAppSelector(getSelectedHandProjectCards);

  if (playerID === null) return null;
  const hand = PlayersSelector.getProjectCards(G.players, playerID);
  const event = G.table.eventSlot;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 800, fontSize: 14 }}>你的手牌</span>
          <span className="en-cap">Your hand</span>
        </div>
        <span className="sticker" style={{ marginLeft: 'auto' }}>
          {hand.length}
        </span>
      </div>
      {hand.map((card) => (
        <ProjectCardFace
          key={card.id}
          card={card}
          data-testid={`hand-card-${card.id}`}
          selected={handInteractive && !!selectedCards[card.id]}
          onClick={idle || handInteractive ? () => handleTap(card.id) : undefined}
        />
      ))}
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

      {event && (
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
