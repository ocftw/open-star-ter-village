import type { State } from 'boardgame.io';
import { playerView } from '@/game/core/playerView';
import type { ProjectCard } from '@/game/card';
import type { GameState } from '@/game/store/store';
import { cardValue, finishChance, nodeValue, pace, position } from './evaluate';
import { createProfileBot } from './profileBot';
import { ADVANCE, NOVICE, NORMAL, type Weights } from './profiles';
import { initialState, runGame } from './runner';

function actionState(round = 1): State<GameState> {
  const state = structuredClone(initialState(2, 'normal-test'));
  state.G.standard!.phase = 'action';
  state.G.standard!.choices = [];
  state.G.standard!.round = round;
  state.ctx = { ...state.ctx, activePlayers: { [state.ctx.currentPlayer]: 'action' } };
  return state;
}

function addProject(G: GameState, owner: string, requirement: number, value: number) {
  const slot = G.table.projectBoard.find(s => !s.card)!;
  Object.assign(slot, {
    card: { id: 'p', name: 'p', type: 'ignored', difficulty: 2, description: '', requirements: { 工程師: requirement } },
    owner, ownerToken: 1, lastContributor: owner, contributions: [{ jobName: '工程師', worker: owner, value }],
  });
  return slot;
}

const at = (state: State<GameState>) => {
  const me = state.ctx.currentPlayer;
  return position(playerView({ G: state.G, ctx: state.ctx, playerID: me }), state.ctx, me, NORMAL);
};

const card = (difficulty: number, requirements: Record<string, number>): Pick<ProjectCard, 'name' | 'difficulty' | 'requirements'> =>
  ({ name: `${difficulty}★`, difficulty, requirements });
const threeStar = card(3, { 工程師: 8, 美術設計: 8, 文案企劃: 6 });

describe('normal profile', () => {
  test('is Advance with the full tree weight and a planner', () => {
    const changed = (Object.keys(ADVANCE.weights) as (keyof Weights)[]).filter(key => NORMAL.weights[key] !== ADVANCE.weights[key]);
    expect(changed).toEqual(['tree']);
    expect(NORMAL.weights.tree).toBe(1);
    expect(NORMAL.planner).toBeDefined();
    expect(NOVICE.planner).toBeUndefined();
    expect(ADVANCE.planner).toBeUndefined();
  });

  test('a project is more likely to finish with more rounds left', () => {
    const early = actionState(1);
    const late = actionState(early.G.rules.numNonEndGameEventCards + 1);
    const me = early.ctx.currentPlayer;
    const slots = [early, late].map(state => addProject(state.G, me, 12, 1));
    expect(finishChance(at(early), slots[0])).toBeGreaterThan(finishChance(at(late), slots[1]));
  });

  test('a faster pace and another contributor raise the finish chance', () => {
    const state = actionState(4);
    const me = state.ctx.currentPlayer;
    const slot = addProject(state.G, me, 12, 1);
    const p = at(state);
    const alone = finishChance(p, slot);
    expect(finishChance(p, slot, pace(p, 'data-4'))).toBeGreaterThan(alone);
    slot.contributions.push({ jobName: '工程師', worker: me === '0' ? '1' : '0', value: 1 });
    expect(finishChance(at(state), slot)).toBeGreaterThan(alone);
  });

  test('pace reflects grown abilities from the rules', () => {
    const state = actionState();
    const base = pace(at(state));
    expect(base).toEqual({ owned: 3, joined: 4, recruit: 1, createCost: 2, apPerRound: 3, engineerStart: 1 });
    expect(pace(at(state), 'source-5').createCost).toBe(1);
    expect(pace(at(state), 'data-3').apPerRound).toBe(4);
  });

  test('a card is worth more once there is time to finish it and with a faster pace', () => {
    const p = at(actionState());
    // A 3★ needs 11 AP alone at base pace; 8 rounds leave room for it, 2 do not.
    expect(cardValue(p, threeStar, 8)).toBeGreaterThan(cardValue(p, threeStar, 2));
    expect(cardValue(p, threeStar, 3, { ...pace(p), owned: 4, apPerRound: 4 })).toBeGreaterThan(cardValue(p, threeStar, 3));
    expect(cardValue(p, threeStar, 0)).toBe(0);
  });

  test('values a tree ability more when it speeds up its own unfinished project', () => {
    const state = actionState(3);
    const without = nodeValue(at(state), 'data-4');
    addProject(state.G, state.ctx.currentPlayer, 14, 1);
    expect(nodeValue(at(state), 'data-4')).toBeGreaterThan(without);
  });

  test.each([2, 3, 4])('plays only legal moves to game over: %i players', numPlayers => {
    const run = runGame({ numPlayers, seed: `normal-legal-${numPlayers}`, bots: createProfileBot(NORMAL) });
    expect(run.state.ctx.gameover).toBeDefined();
  });

  test('replays the same game from the same seed', () => {
    const play = () => runGame({ numPlayers: 3, seed: 'normal-replay', bots: createProfileBot(NORMAL) });
    const [first, second] = [play(), play()];
    expect(second.moves).toEqual(first.moves);
    expect(second.state.G.table.scoreBoard).toEqual(first.state.G.table.scoreBoard);
  });
});
