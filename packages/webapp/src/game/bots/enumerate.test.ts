import { enumerate } from './enumerate';
import { activePlayer, gameReducer, initialState } from './runner';
import { seededRandom } from './random';
import { playerView } from '@/game/core/playerView';

/** Random play that rarely ends a turn early, so games reach deep tree and ability states. */
function playAndCheckEveryAction(numPlayers: number, seed: string, seen: Map<string, number>) {
  const reduce = gameReducer(seed);
  const random = seededRandom(seed);
  let state = initialState(numPlayers, seed);
  for (let step = 0; !state.ctx.gameover; step++) {
    expect(step).toBeLessThan(2000);
    const playerID = activePlayer(state.ctx);
    const actions = enumerate(playerView({ G: state.G, ctx: state.ctx, playerID }), state.ctx, playerID);
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) {
      const next = reduce(state, playerID, action);
      if (next._stateID === state._stateID) throw new Error(`Rejected ${action.move} ${JSON.stringify(action.args)} (seed ${seed}, step ${step})`);
      const key = action.move === 'resolveStandardChoice' ? `choice:${state.G.standard!.choices[0].kind}` : action.move;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const others = actions.filter(a => a.move !== 'endActionTurn');
    const pool = others.length && random() > 0.05 ? others : actions;
    state = reduce(state, playerID, pool[Math.floor(random() * pool.length)]);
  }
  expect(state.G.standard!.round).toBe(9 - numPlayers);
}

describe('enumerate', () => {
  test('every enumerated action is accepted by the game across seeded 2/3/4-player games', () => {
    const seen = new Map<string, number>();
    for (const numPlayers of [2, 3, 4]) {
      for (let i = 0; i < 2; i++) playAndCheckEveryAction(numPlayers, `enumerate-${numPlayers}-${i}`, seen);
    }
    for (const move of ['growTree', 'createProject', 'recruit', 'contributeOwnedProjects', 'contributeJoinedProjects', 'removeAndRefillJobs', 'endActionTurn']) {
      expect(seen.get(move)).toBeGreaterThan(0);
    }
  });

  test('returns nothing for a player who may not act', () => {
    const state = initialState(2, 'idle');
    const other = state.ctx.currentPlayer === '0' ? '1' : '0';
    expect(enumerate(playerView({ G: state.G, ctx: state.ctx, playerID: other }), state.ctx, other)).toEqual([]);
  });
});
