import type { StarterRotation } from '@/game/store/store';

/** Next seven turns, including the current one. Round wrap mirrors passStartPlayerToken. */
export function buildTurnQueue(
  playOrder: readonly string[],
  playOrderPos: number,
  starterRotation: StarterRotation = 'none',
): string[] {
  if (playOrder.length === 0) return [];
  let order = [...playOrder];
  let position = playOrderPos;
  return Array.from({ length: 7 }, () => {
    const player = order[position];
    position += 1;
    if (position === order.length) {
      if (starterRotation === 'counterclockwise') {
        order = order.slice(-1).concat(order.slice(0, -1));
      } else if (starterRotation === 'clockwise') {
        order = order.slice(1).concat(order[0]);
      }
      position = 0;
    }
    return player;
  });
}
