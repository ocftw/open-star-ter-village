import React from 'react';
import { GameContext } from '@/components/GameContextHelpers';
import { DoubleChevron, IconButton } from '@/components/design';
import TurnQueue from './TurnQueue';

/** Page scroll for story 5; story 490 will bind this affordance to the projects scroller. */
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
      const { bottom } = projects.getBoundingClientRect();
      setOverflow(bottom + window.scrollY > window.innerHeight + 1);
      setAtEnd(bottom <= window.innerHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(projects);
    if (header) observer.observe(header);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [horizontal, projectsRef]);

  const scrollProjects = () => {
    const projects = projectsRef.current;
    if (!projects) return;
    const { top, bottom } = projects.getBoundingClientRect();
    const stickyTop = parseFloat(stripRef.current?.style.getPropertyValue('--turn-strip-top') || '88');
    window.scrollTo({
      top: Math.max(0, atEnd
        ? top + window.scrollY - stickyTop
        : Math.min(window.scrollY + window.innerHeight * 0.8, bottom + window.scrollY - window.innerHeight)),
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  return (
    <div ref={stripRef} className={`turn-strip${horizontal ? ' turn-strip-horizontal' : ''}`} data-testid="turn-strip">
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
