import React from 'react';
import type { EventCard } from '@/game';
import EventCardDialog from './EventCardDialog';

export default function EventButton({ event }: { event: EventCard | null }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [event?.id]);

  if (!event) return null;

  return (
    <>
      <button
        type="button"
        className="event-btn"
        data-testid="event-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        事件<small>EVENT</small>
      </button>
      <EventCardDialog event={event} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
