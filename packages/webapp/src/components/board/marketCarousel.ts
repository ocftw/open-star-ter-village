/** Pure paging math for the job-market carousel (no DOM access). */

/** Sub-pixel and rounding slack when deciding whether content remains on a side. */
export const EDGE_TOLERANCE = 2;

export type CarouselMetrics = {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
};

export function maxScrollLeft({ clientWidth, scrollWidth }: Pick<CarouselMetrics, 'clientWidth' | 'scrollWidth'>): number {
  return Math.max(0, scrollWidth - clientWidth);
}

export function canScrollPrev({ scrollLeft }: Pick<CarouselMetrics, 'scrollLeft'>): boolean {
  return scrollLeft > EDGE_TOLERANCE;
}

export function canScrollNext(metrics: CarouselMetrics): boolean {
  return metrics.scrollLeft < maxScrollLeft(metrics) - EDGE_TOLERANCE;
}

/** Whole tiles moved per click: what fits, minus one for context, at least one. */
export function pageStep(clientWidth: number, tileStep: number): number {
  if (!(tileStep > 0)) return 1;
  return Math.max(1, Math.floor(clientWidth / tileStep) - 1);
}

/** Target scrollLeft after a click, snapped to a tile edge and clamped to the scrollable range. */
export function pageTarget(metrics: CarouselMetrics, tileStep: number, direction: -1 | 1): number {
  const max = maxScrollLeft(metrics);
  if (!(tileStep > 0)) return Math.min(max, Math.max(0, metrics.scrollLeft));
  const index = Math.round(metrics.scrollLeft / tileStep);
  const target = (index + direction * pageStep(metrics.clientWidth, tileStep)) * tileStep;
  // Reaching the final tiles lands exactly on the end instead of stopping a few px short.
  if (direction === 1 && max - target < tileStep / 2) return max;
  return Math.min(max, Math.max(0, target));
}
