import { useLayoutEffect, useRef } from 'react';

/** Animate only surviving rail items, using their untransformed horizontal offsets. */
export function useStartProjectReorder(
  railRef: React.RefObject<HTMLElement>,
  itemSelector: string,
  filter: string | null,
  active: boolean,
) {
  const previous = useRef<{ active: boolean; filter: string | null; offsets: Map<string, number> }>();
  const animations = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const items = Array.from(railRef.current?.querySelectorAll<HTMLElement>(itemSelector) ?? []);
    const offsets = new Map(items.map((item) => [item.dataset.startId!, item.offsetLeft]));
    const before = previous.current;
    previous.current = { active, filter, offsets };
    if (!active || !before?.active) return;

    if (filter && (before.filter !== filter || items.some((item) => before.offsets.get(item.dataset.startId!) !== item.offsetLeft))) {
      const firstEligible = items.find((item) => !item.querySelector('[data-visual-state="disabled"]'));
      if (firstEligible && firstEligible.parentElement) firstEligible.parentElement.scrollLeft = 0;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (items.every((item) => before.offsets.get(item.dataset.startId!) === item.offsetLeft)) return;

    animations.current.forEach((animation) => animation.cancel());
    animations.current = items.flatMap((item) => {
      const oldOffset = before.offsets.get(item.dataset.startId!);
      if (oldOffset === undefined || oldOffset === item.offsetLeft || !item.animate) return [];
      return [item.animate(
        [{ transform: `translateX(${oldOffset - item.offsetLeft}px)` }, { transform: 'translateX(0)' }],
        { duration: 160, easing: 'ease-out' },
      )];
    });
  });
}
