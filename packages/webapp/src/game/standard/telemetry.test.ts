import { playerView } from '../core/playerView';
import { createProfileBot } from '../bots/profileBot';
import { BALANCED } from '../bots/profiles';
import { runGame } from '../bots/runner';
import { buildStandardExport } from './export';

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
    for (const stats of Object.values(telemetry.choices)) {
      expect(stats!.resolved + stats!.skipped + stats!.noTarget).toBeGreaterThanOrEqual(stats!.queued);
    }
    expect(telemetry.government5.used).toBeLessThanOrEqual(telemetry.government5.budget);
  });

  test('records the first round each player passes 20 influence', () => {
    for (const [playerID, score] of Object.entries(G.table.scoreBoard)) {
      if (score > 20) expect(telemetry.firstOver20Round[playerID]).toBeGreaterThan(0);
    }
  });

  test('the player export keeps its fields and includes telemetry only when asked', () => {
    const playerExport = buildStandardExport(playerView({ G, ctx: run.state.ctx, playerID: '0' }), run.state.ctx, { build: 'test', now: 0 });
    expect(Object.keys(playerExport)).toEqual(['ruleset', 'build', 'players', 'rounds', 'completedProjectIds', 'grown', 'remainingHearts', 'scores', 'outcome', 'finished', 'log', 'exportedAt', 'durationSeconds']);
    expect(buildStandardExport(G, run.state.ctx, { build: 'test', telemetry }).telemetry).toBe(telemetry);
  });
});
