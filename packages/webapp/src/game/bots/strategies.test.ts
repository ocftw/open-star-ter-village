import { PROFILES } from './profiles';
import { getBotStrategy } from './seat';
import { BOT_STRATEGIES, isBotStrategy, pickBotName } from './strategies';

describe('bot strategies', () => {
  test('every strategy has enough distinct names for a full Standard room of bots', () => {
    for (const strategy of Object.values(BOT_STRATEGIES)) {
      expect(new Set(strategy.names).size).toBe(strategy.names.length);
      expect(strategy.names.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('every strategy is keyed by its id, uses its CLI profile, and has a label and description', () => {
    for (const [key, strategy] of Object.entries(BOT_STRATEGIES)) {
      expect(strategy.id).toBe(key);
      expect(strategy.profile).toBe(PROFILES[key]);
      expect(strategy.label).toMatch(/\S/);
      expect(strategy.description).toMatch(/\S/);
    }
  });

  test('no two strategies share a seat name', () => {
    const names = Object.values(BOT_STRATEGIES).flatMap(strategy => strategy.names);
    expect(new Set(names).size).toBe(names.length);
  });

  test('picks the first unused name, then numbers once the list runs out', () => {
    const { names } = BOT_STRATEGIES.novice;
    expect(pickBotName('novice', [])).toBe(names[0]);
    expect(pickBotName('novice', [names[0], 'Alice'])).toBe(names[1]);
    expect(pickBotName('novice', names)).toBe(`${names[0]} 2`);
    expect(pickBotName('novice', [...names, `${names[0]} 2`])).toBe(`${names[0]} 3`);
  });

  test('recognises only registered strategy ids', () => {
    expect(isBotStrategy('novice')).toBe(true);
    expect(isBotStrategy('advance')).toBe(true);
    expect(isBotStrategy('toString')).toBe(false);
    expect(isBotStrategy(undefined)).toBe(false);
  });

  test('seats saved under the old Balanced and Counter ids still resolve, but new seats cannot use them', () => {
    expect(getBotStrategy({ bot: { strategy: 'balanced' } })).toBe(BOT_STRATEGIES.novice);
    expect(getBotStrategy({ bot: { strategy: 'counter' } })).toBe(BOT_STRATEGIES.advance);
    expect(isBotStrategy('balanced')).toBe(false);
    expect(isBotStrategy('counter')).toBe(false);
  });
});
