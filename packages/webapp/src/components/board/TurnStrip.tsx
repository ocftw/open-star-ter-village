import React from 'react';
import { GameContext } from '@/components/GameContextHelpers';
import { DoubleChevron, IconButton } from '@/components/design';
import TurnQueue from './TurnQueue';
import EventButton from './EventButton';

// Scroll offsets and layout bounds can round to different CSS pixels.
const SCROLL_TOLERANCE = 2;

export default function TurnStrip({ gameContext, projectsRef, horizontal = false }: {
  gameContext: GameContext;
  projectsRef: React.RefObject<HTMLDivElement>;
  horizontal?: boolean;
}) {
  const stripRef = React.useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = React.useState(false);
  const [atEnd, setAtEnd] = React.useState(false);

  React.useEffect(() => {
    if (horizontal) return;
    const projects = projectsRef.current;
    const strip = stripRef.current;
    if (!projects || !strip) return;
    const header = strip.closest('[data-game-board]')?.querySelector('[data-testid="app-header"]');
    const measure = () => {
      const headerHeight = header?.getBoundingClientRect().height ?? 72;
      strip.style.setProperty('--turn-strip-top', `${headerHeight + 16}px`);
      projects.style.setProperty('--turn-strip-top', `${headerHeight + 16}px`);
      // Notices stacked above the scroller in the same column also eat viewport height.
      const column = projects.parentElement;
      const above = column ? Math.max(0, projects.offsetTop - column.offsetTop) : 0;
      projects.style.setProperty('--project-area-above', `${above}px`);
      const end = projects.scrollHeight - projects.clientHeight;
      setOverflow(end > SCROLL_TOLERANCE);
      setAtEnd(projects.scrollTop >= end - SCROLL_TOLERANCE);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(projects);
    // Content growth inside a height-capped box does not resize the box itself.
    Array.from(projects.children).forEach((child) => observer.observe(child));
    Array.from(projects.parentElement?.children ?? []).forEach((sibling) => sibling !== projects && observer.observe(sibling));
    if (header) observer.observe(header);
    window.addEventListener('resize', measure);
    projects.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      projects.removeEventListener('scroll', measure);
    };
  }, [horizontal, projectsRef]);

  const scrollProjects = () => {
    const projects = projectsRef.current;
    if (!projects) return;
    const end = projects.scrollHeight - projects.clientHeight;
    projects.scrollTo({
      top: projects.scrollTop >= end - SCROLL_TOLERANCE
        ? 0
        : Math.min(projects.scrollTop + projects.clientHeight * 0.8, end),
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  return (
    <div ref={stripRef} className={`turn-strip${horizontal ? ' turn-strip-horizontal' : ''}`} data-testid="turn-strip">
      <EventButton event={gameContext.G.table.eventSlot} />
      <TurnQueue gameContext={gameContext} horizontal={horizontal} />
      {!horizontal && overflow && (
        <IconButton
          label={atEnd ? '專案區回到頂端' : '專案區往下捲'}
          className={`turn-project-scroll${atEnd ? ' turn-project-scroll-up' : ''}`}
          onClick={scrollProjects}
        >
          <DoubleChevron direction="down" />
        </IconButton>
      )}
    </div>
  );
}
