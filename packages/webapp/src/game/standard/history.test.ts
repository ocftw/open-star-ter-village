import { runGame } from '../bots/runner';
import { createProfileBot } from '../bots/profileBot';
import { BALANCED } from '../bots/profiles';
import { playerView } from '../core/playerView';
import { publicHistory } from './history';
import { normalizeStandardOptions } from './options';

test.each([2, 3, 4])('public history reconciles every final score and is shared by all %i players', numPlayers => {
  const run = runGame({ numPlayers, seed: 'public-history-v1', bots: createProfileBot(BALANCED),
    standardOptions: normalizeStandardOptions({ starterRotation: 'clockwise', extraRounds: 2, treePreset: 'cc-00246' }),
  });
  const { G, ctx } = run.state;
  const entries = G.standard!.log;
  expect(entries.map(entry => entry.sequence)).toEqual(entries.map((_, index) => index + 1));
  for (const [id, score] of Object.entries(G.table.scoreBoard)) {
    expect(entries.filter(entry => entry.kind === 'score' && entry.playerId === id).reduce((sum, entry) => sum + entry.scoreDelta!, 0)).toBe(score);
    expect(entries.filter(entry => entry.kind === 'score' && entry.playerId === id && entry.target === '最終回合剩餘行動點').length).toBeLessThanOrEqual(1);
    expect(playerView({ G, ctx, playerID: id }).standard!.log).toEqual(publicHistory(entries));
  }
  expect(entries.some(entry => entry.kind === 'createProject')).toBe(true);
  expect(entries.filter(entry => entry.kind === 'event')).toHaveLength(11 - numPlayers);
  expect(JSON.parse(JSON.stringify(G)).standard.log).toEqual(JSON.parse(JSON.stringify(entries)));
});

test('legacy private discard targets are removed without rewriting stored rules', () => {
  const stored = [{ round: 1, kind: 'discard', target: '{"cardId":"secret"}' }];
  expect(JSON.stringify(publicHistory(stored))).not.toContain('secret');
  expect(stored[0].target).toContain('secret');
});
