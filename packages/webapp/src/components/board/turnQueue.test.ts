import { buildTurnQueue } from './turnQueue';
import { passStartPlayerToken } from '@/game/core/handler/passStartPlayerToken';
import type { StarterRotation } from '@/game/store/store';

it.each([
  [['0', '1'], ['0', '1', '1', '0', '0', '1', '1']],
  [['0', '1', '2'], ['0', '1', '2', '1', '2', '0', '2']],
  [['0', '1', '2', '3'], ['0', '1', '2', '3', '1', '2', '3']],
])('previews seven clockwise turns for order %j', (order, expected) => {
  expect(buildTurnQueue(order, 0, 'clockwise')).toEqual(expected);
});

it.each([
  [['0', '1'], ['0', '1', '0', '1', '0', '1', '0']],
  [['0', '1', '2'], ['0', '1', '2', '0', '1', '2', '0']],
  [['0', '1', '2', '3'], ['0', '1', '2', '3', '0', '1', '2']],
])('previews a repeating order when starterRotation is none for %j', (order, expected) => {
  expect(buildTurnQueue(order, 0)).toEqual(expected);
  expect(buildTurnQueue(order, 0, 'none')).toEqual(expected);
});

it('previews counterclockwise wraps', () => {
  expect(buildTurnQueue(['0', '1', '2'], 0, 'counterclockwise')).toEqual(['0', '1', '2', '2', '0', '1', '1']);
});

it('starts at the mid-round position, then rotates at every wrap', () => {
  expect(buildTurnQueue(['0', '1', '2'], 1, 'clockwise')).toEqual(['1', '2', '1', '2', '0', '2', '0']);
});

it('uses the supplied rotated order instead of seat order', () => {
  expect(buildTurnQueue(['2', '0', '1'], 2, 'clockwise')).toEqual(['1', '0', '1', '2', '1', '2', '0']);
});

it.each(['none', 'clockwise', 'counterclockwise'] as StarterRotation[])(
  'matches the actual start-token handler over round boundaries (%s)',
  (starterRotation) => {
    for (const count of [2, 3, 4]) {
      const G = {
        playOrder: Array.from({ length: count }, (_, i) => String(i)),
        starterRotation,
      };
      const queue = buildTurnQueue(G.playOrder, count - 1, starterRotation);
      let position = count - 1;
      for (const player of queue) {
        expect(player).toBe(G.playOrder[position]);
        position += 1;
        if (position === count) {
          passStartPlayerToken({ G } as Parameters<typeof passStartPlayerToken>[0]);
          position = 0;
        }
      }
    }
  },
);

it('has no turns before an order exists', () => {
  expect(buildTurnQueue([], 0)).toEqual([]);
});
