import { useLayoutEffect, useRef } from 'react';
import type { GameContext } from '@/components/GameContextHelpers';

type Departure = {
  projectId: string;
  jobId: string;
  turn: number;
  numMoves: number | undefined;
  faces: { node: HTMLElement; rect: DOMRect }[];
};

const duration = 260;

/** Save visible rail faces before dispatch, and animate them only if G accepted the pair. */
export function useStartProjectDeparture({ G, ctx, playerID }: GameContext) {
  const pending = useRef<Departure>();
  useLayoutEffect(() => {
    const departure = pending.current;
    if (!departure || (departure.turn === ctx.turn && departure.numMoves === ctx.numMoves)) return;
    pending.current = undefined;
    const accepted =
      G.table.projectBoard.some((slot) => slot.card?.id === departure.projectId && slot.owner === playerID) &&
      !G.table.jobSlots.some((job) => job.id === departure.jobId);
    if (!accepted || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    for (const { node, rect } of departure.faces) {
      Object.assign(node.style, {
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        zIndex: '40',
        pointerEvents: 'none',
      });
      document.body.append(node);
      const animation = node.animate(
        [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }],
        { duration, easing: 'ease-in' },
      );
      animation.onfinish = animation.oncancel = () => node.remove();
    }
  }, [G, ctx.turn, ctx.numMoves, playerID]);

  return (projectId: string, jobId: string) => {
    if (typeof window === 'undefined' || !HTMLElement.prototype.animate ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const faces = [`hand-card-${projectId}`, `job-card-${jobId}`].flatMap((id) => {
      const original = document.querySelector<HTMLElement>(`[data-testid="${CSS.escape(id)}"]`);
      if (!original) return [];
      const rect = original.getBoundingClientRect();
      const clip = original.closest('.hand-row, .market-carousel__row')?.getBoundingClientRect();
      // A face can be partially clipped (or completely scrolled away).
      if (!clip || rect.left < clip.left || rect.right > clip.right ||
        rect.top < 0 || rect.bottom > window.innerHeight) return [];
      const node = original.cloneNode(true) as HTMLElement;
      for (const name of [...node.getAttributeNames()]) {
        if (name.startsWith('data-') || name === 'tabindex' || name === 'role') node.removeAttribute(name);
      }
      if (node instanceof HTMLButtonElement) node.disabled = true;
      node.setAttribute('inert', '');
      node.setAttribute('aria-hidden', 'true');
      return [{ node, rect }];
    });
    pending.current = faces.length ? { faces, projectId, jobId, turn: ctx.turn, numMoves: ctx.numMoves } : undefined;
  };
}
