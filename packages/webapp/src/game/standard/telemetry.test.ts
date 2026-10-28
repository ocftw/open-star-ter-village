import { playerView } from '../core/playerView';
import { createProfileBot } from '../bots/profileBot';
import { BALANCED } from '../bots/profiles';
import { initialState, runGame } from '../bots/runner';
import type { GameState } from '../store/store';
import { enqueue, resolveStandardChoice } from './engine';
import { buildStandardExport } from './export';
import type { FnContext } from 'boardgame.io';

const run = runGame({ numPlayers: 3, seed: 'telemetry', bots: createProfileBot(BALANCED) });
const G = run.state.G;
const telemetry = G.standard!.telemetry!;

describe('Standard telemetry', () => {
  test('is never sent to players or observers', () => {
    for (const playerID of ['0', '1', '2', null]) {
      const view = playerView({ G, ctx: run.state.ctx, playerID });
      expect(view.standard).toBeDefined();
      expect(view.standard).not.toHaveProperty('telemetry');
    }
    // Stripping the view must not remove it from the authoritative state.
    expect(G.standard!.telemetry).toBeDefined();
  });

  test('records initiator and difficulty for every project, and finisher plus contributions for completed ones', () => {
    const projects = Object.entries(telemetry.projects);
    expect(projects.length).toBeGreaterThan(0);
    for (const [, project] of projects) {
      expect(['0', '1', '2']).toContain(project.initiator);
      expect(project.difficulty).toBeGreaterThan(0);
    }
    for (const id of G.standard!.completedProjectIds) {
      const project = telemetry.projects[id];
      expect(project.finisher).toBeDefined();
      expect(project.completedRound).toBeGreaterThan(0);
      expect(Object.values(project.contributions!).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    }
  });

  test('counts every queued choice as resolved, skipped or dropped', () => {
    expect(G.standard!.choices).toEqual([]);
    for (const stats of Object.values(telemetry.choices)) {
      expect(stats!.resolved + stats!.skipped + stats!.noTarget).toBe(stats!.queued);
    }
    expect(telemetry.government5.used).toBeLessThanOrEqual(telemetry.government5.budget);
  });

  test('counts each multi-point Government 5 point as its own queued choice', () => {
    const state = structuredClone(initialState(2, 'gov5').G);
    state.standard!.choices = [];
    const slot = state.table.projectBoard.find(s => !s.card)!;
    Object.assign(slot, {
      card: { id: 'target', name: 'target', type: 'ignored', difficulty: 1, description: '', requirements: { 工程師: 10 } },
      owner: '0', ownerToken: 1, lastContributor: '0', contributions: [{ jobName: '工程師', worker: '0', value: 1 }],
    });
    enqueue(state, 'government5', '0', 'completed-project', 3);
    const move = { G: state, playerID: '0' } as unknown as FnContext<GameState> & { playerID: string };
    const target = { projectId: 'target', worker: '0', jobName: '工程師' };
    resolveStandardChoice(move, state.standard!.choices[0].id, target);
    resolveStandardChoice(move, state.standard!.choices[0].id, target);
    resolveStandardChoice(move, state.standard!.choices[0].id, null);
    const t = state.standard!.telemetry!;
    expect(t.choices.government5).toEqual({ queued: 3, resolved: 2, skipped: 1, noTarget: 0 });
    expect(t.government5).toEqual({ budget: 3, used: 2 });
  });

  test('records the first round each player passes 20 influence', () => {
    for (const [playerID, score] of Object.entries(G.table.scoreBoard)) {
      if (score > 20) expect(telemetry.firstOver20Round[playerID]).toBeGreaterThan(0);
    }
  });

  test('the player export keeps its fields and includes telemetry only when asked', () => {
    const playerExport = buildStandardExport(playerView({ G, ctx: run.state.ctx, playerID: '0' }), run.state.ctx, { build: 'test', now: 0 });
    expect(Object.keys(playerExport)).toEqual(['ruleset', 'experiments', 'build', 'players', 'rounds', 'standardOptions', 'completedComplexity', 'completedProjectIds', 'grown', 'remainingHearts', 'scores', 'outcome', 'finished', 'log', 'exportedAt', 'durationSeconds']);
    expect(playerExport.experiments).toEqual({ government5: 'existing', completionRewards: 'fixed' });
    expect(buildStandardExport(G, run.state.ctx, { build: 'test', telemetry }).telemetry).toBe(telemetry);
  });
});
