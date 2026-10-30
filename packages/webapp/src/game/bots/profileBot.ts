import { enumerate } from './enumerate';
import { position, scoreAction } from './evaluate';
import type { Profile } from './profiles';
import type { Bot } from './types';

/** Greedy bot: scores every legal action with the profile's weights and plays the best one. */
export function createProfileBot(profile: Profile): Bot {
  return {
    name: profile.name,
    decide({ view, ctx, playerID, random }) {
      const actions = enumerate(view, ctx, playerID);
      if (actions.length === 0) throw new Error(`No legal action for player ${playerID}`);
      const p = position(view, ctx, playerID, profile);
      let best: typeof actions = [];
      let bestScore = -Infinity;
      for (const action of actions) {
        const score = scoreAction(p, action);
        if (score > bestScore + 1e-9) {
          best = [action];
          bestScore = score;
        } else if (Math.abs(score - bestScore) <= 1e-9) {
          best.push(action);
        }
      }
      return best[Math.floor(random() * best.length)];
    },
  };
}
