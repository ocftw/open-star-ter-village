import React from 'react';
import type { EventCard } from '@/game';
import { Modal, StickerButton } from '@/components/design';

/** Shared event card; story 7 can also present it at the start of a round. */
export default function EventCardDialog({ event, open, onClose }: {
  event: EventCard;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      width="min(640px, 100%)"
      dataTestid="event-card-dialog"
    >
      <div className="event-card" data-testid="event-card-banner">
        <span className="event-tag">事件 EVENT</span>
        <div className="event-art" aria-hidden="true">
          {event.type === 'last_round' ? '⏳' : '✦'}
        </div>
        <div>
          <h2 id={titleId}>{event.name}</h2>
          <p id={descriptionId}>{event.description}</p>
        </div>
        <StickerButton type="button" variant="dark" size="sm" onClick={onClose}>
          知道了
        </StickerButton>
      </div>
    </Modal>
  );
}
