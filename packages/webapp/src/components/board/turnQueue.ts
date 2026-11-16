/** Next seven turns, including the current one. Round wrap mirrors passStartPlayerToken. */
export function buildTurnQueue(playOrder: readonly string[], playOrderPos: number): string[] {
  if (playOrder.length === 0) return [];
  let order = [...playOrder];
  let position = playOrderPos;
  return Array.from({ length: 7 }, () => {
    const player = order[position];
    position += 1;
    if (position === order.length) {
      order = order.slice(1).concat(order[0]);
      position = 0;
    }
    return player;
  });
}
