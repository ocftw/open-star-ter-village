import React from 'react';
import type { EventCard } from '@/game';
import EventCardDialog from './EventCardDialog';
import { roundLabel } from './roundLabel';

export default function RoundStartOverlay({ event, round, open, onClose }: {
  event: EventCard | null;
  round: number;
  open: boolean;
  onClose: () => void;
}) {
  const surfaceRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!open || !surface) return;
    // The native dialog stays in the top layer, centred on Figma's masked
    // board area rather than on the adjacent action panel.
    const measure = () => {
      const rect = surface.getBoundingClientRect();
      const top = Math.max(0, rect.top);
      const bottom = Math.min(window.innerHeight, rect.bottom);
      surface.style.setProperty('--round-start-x', `${rect.left + rect.width / 2}px`);
      surface.style.setProperty('--round-start-y', `${(top + bottom) / 2}px`);
      surface.style.setProperty('--round-start-width', `${rect.width}px`);
      surface.style.setProperty('--round-start-height', `${bottom - top}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [open]);

  if (!open || !event) return null;

  return (
    <div ref={surfaceRef} className="round-start-overlay" data-testid="round-start-overlay">
      <EventCardDialog event={event} open onClose={onClose} roundTitle={roundLabel(round)} />
    </div>
  );
}
