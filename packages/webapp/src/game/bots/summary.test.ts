import { createProfileBot } from './profileBot';
import { BALANCED } from './profiles';
import { runGame } from './runner';
import { summarize, summaryCsv } from './summary';

describe('batch summary', () => {
  const bot = createProfileBot(BALANCED);
  const runs = [2, 3].flatMap(numPlayers => ['a', 'b'].map(seed => runGame({ numPlayers, seed: `summary-${seed}`, bots: bot })));
  const summaries = summarize(runs);

  test('groups games by player count with consistent totals', () => {
    expect(summaries.map(s => [s.numPlayers, s.games])).toEqual([[2, 2], [3, 2]]);
    for (const s of summaries) {
      const winShare = Object.values(s.seatWinRate).reduce((a, b) => a + b, 0);
      expect(winShare).toBeCloseTo(1, 1);
      expect(Object.values(s.outcomes).reduce((a, b) => a + b, 0)).toBe(s.games);
      expect(Object.values(s.completionsByDifficulty).reduce((a, b) => a + b, 0)).toBeCloseTo(s.avgCompletions * s.games);
      expect(s.score.min).toBeLessThanOrEqual(s.score.median);
      expect(s.score.median).toBeLessThanOrEqual(s.score.max);
    }
  });

  test('writes one CSV row per player count', () => {
    const lines = summaryCsv(summaries).trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0].split(',')).toHaveLength(lines[1].split(',').length);
  });
});
