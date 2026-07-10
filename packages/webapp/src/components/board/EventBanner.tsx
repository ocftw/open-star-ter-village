import { EventCard } from '@/game';

/** Sticker-style event card, shown in the left rail (design: EventCard). */
export default function EventBanner({ event }: { event: EventCard }) {
  return (
    <div
      data-testid="event-card-banner"
      style={{
        background: 'var(--paper)',
        border: '2px solid var(--ink)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-sticker)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div
        style={{
          background: 'var(--orange)',
          color: 'white',
          border: '1.5px solid var(--ink)',
          borderRadius: 999,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          boxShadow: '0 2px 0 var(--ink)',
          flexShrink: 0,
        }}
      >
        事件 EVENT
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{event.name}</div>
        <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--ink-soft)' }}>
          {event.description}
        </div>
      </div>
    </div>
  );
}
