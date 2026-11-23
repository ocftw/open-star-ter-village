'use client';

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DoubleChevron, IconButton } from '@/components/design';
import { canScrollNext, canScrollPrev, pageTarget } from './marketCarousel';

const DEFAULT_TILE_STEP = 134;

/**
 * One-row horizontal scroller with « » paging and edge fades (prototype
 * .scroll-wrap). `resetKey` scrolls back to the start whenever it changes.
 */
export default function MarketCarousel({
  children,
  label,
  resetKey,
}: {
  children: ReactNode;
  label: string;
  resetKey?: string | number | null;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [sides, setSides] = useState({ prev: false, next: false });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const prev = canScrollPrev(row);
    const next = canScrollNext(row);
    setSides((current) => (current.prev === prev && current.next === next ? current : { prev, next }));
  }, []);

  // Children change identity every render; measuring is cheap and bails when unchanged.
  useLayoutEffect(measure);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [measure]);

  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    const row = rowRef.current;
    if (row) {
      row.scrollLeft = 0;
      measure();
    }
  }, [resetKey, measure]);

  const page = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    const [first, second] = [row.children[0] as HTMLElement | undefined, row.children[1] as HTMLElement | undefined];
    const step = first && second ? second.offsetLeft - first.offsetLeft : first ? first.offsetWidth + 10 : DEFAULT_TILE_STEP;
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollTo({ left: pageTarget(row, step, direction), behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <div className="market-carousel">
      {sides.prev && <span className="market-carousel__fade market-carousel__fade--prev" aria-hidden="true" />}
      {sides.next && <span className="market-carousel__fade market-carousel__fade--next" aria-hidden="true" />}
      <div
        ref={rowRef}
        className="market-carousel__row"
        data-testid="job-market-row"
        tabIndex={0}
        aria-label={label}
        onScroll={measure}
      >
        {children}
      </div>
      {sides.prev && (
        <IconButton
          label={`${label}往左`}
          className="market-carousel__btn market-carousel__btn--prev"
          data-testid="job-market-prev"
          onClick={() => page(-1)}
        >
          <DoubleChevron direction="left" size={18} />
        </IconButton>
      )}
      {sides.next && (
        <IconButton
          label={`${label}往右`}
          className="market-carousel__btn market-carousel__btn--next"
          data-testid="job-market-next"
          onClick={() => page(1)}
        >
          <DoubleChevron direction="right" size={18} />
        </IconButton>
      )}
    </div>
  );
}
