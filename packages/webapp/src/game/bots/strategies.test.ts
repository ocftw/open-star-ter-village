import { BOT_STRATEGIES, isBotStrategy, pickBotName } from './strategies';

describe('bot strategies', () => {
  test('every strategy has enough distinct names for a full Standard room of bots', () => {
    for (const strategy of Object.values(BOT_STRATEGIES)) {
      expect(new Set(strategy.names).size).toBe(strategy.names.length);
      expect(strategy.names.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('picks the first unused name, then numbers once the list runs out', () => {
    const { names } = BOT_STRATEGIES.balanced;
    expect(pickBotName('balanced', [])).toBe(names[0]);
    expect(pickBotName('balanced', [names[0], 'Alice'])).toBe(names[1]);
    expect(pickBotName('balanced', names)).toBe(`${names[0]} 2`);
    expect(pickBotName('balanced', [...names, `${names[0]} 2`])).toBe(`${names[0]} 3`);
  });

  test('recognises only registered strategy ids', () => {
    expect(isBotStrategy('balanced')).toBe(true);
    expect(isBotStrategy('toString')).toBe(false);
    expect(isBotStrategy(undefined)).toBe(false);
  });
});
