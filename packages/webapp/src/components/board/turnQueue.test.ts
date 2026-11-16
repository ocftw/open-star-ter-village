import { buildTurnQueue } from './turnQueue';
import { passStartPlayerToken } from '@/game/core/handler/passStartPlayerToken';

it.each([
  [['0', '1'], ['0', '1', '1', '0', '0', '1', '1']],
  [['0', '1', '2'], ['0', '1', '2', '1', '2', '0', '2']],
  [['0', '1', '2', '3'], ['0', '1', '2', '3', '1', '2', '3']],
])('previews seven turns for order %j', (order, expected) => {
  expect(buildTurnQueue(order, 0)).toEqual(expected);
});

it('starts at the mid-round position, then rotates at every wrap', () => {
  expect(buildTurnQueue(['0', '1', '2'], 1)).toEqual(['1', '2', '1', '2', '0', '2', '0']);
});

it('uses the supplied rotated order instead of seat order', () => {
  expect(buildTurnQueue(['2', '0', '1'], 2)).toEqual(['1', '0', '1', '2', '1', '2', '0']);
});

it.each([2, 3, 4])('matches the actual start-token handler over round boundaries (%i players)', (count) => {
  const G = { playOrder: Array.from({ length: count }, (_, i) => String(i)) };
  const queue = buildTurnQueue(G.playOrder, count - 1);
  let position = count - 1;
  for (const player of queue) {
    expect(player).toBe(G.playOrder[position]);
    position += 1;
    if (position === count) {
      passStartPlayerToken({ G } as Parameters<typeof passStartPlayerToken>[0]);
      position = 0;
    }
  }
});

it('has no turns before an order exists', () => {
  expect(buildTurnQueue([], 0)).toEqual([]);
});
