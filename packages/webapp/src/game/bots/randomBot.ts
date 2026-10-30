import { enumerate } from './enumerate';
import type { Bot } from './types';

/** Picks uniformly among legal moves. A baseline and a fuzzer for rule invariants. */
export const randomBot: Bot = {
  name: 'random',
  decide({ view, ctx, playerID, random }) {
    const actions = enumerate(view, ctx, playerID);
    if (actions.length === 0) throw new Error(`No legal action for player ${playerID}`);
    return actions[Math.floor(random() * actions.length)];
  },
};
