import { DEFAULT_STANDARD_OPTIONS, normalizeStandardOptions, standardRoundCount, TREE_PRESETS } from './options';

describe('Standard room options', () => {
  test('defaults are copied and omitted fields retain defaults', () => {
    const value = normalizeStandardOptions(undefined);
    expect(value).toEqual(DEFAULT_STANDARD_OPTIONS);
    expect(value).not.toBe(DEFAULT_STANDARD_OPTIONS);
    expect(normalizeStandardOptions({ extraRounds: 2 })).toEqual({ ...DEFAULT_STANDARD_OPTIONS, extraRounds: 2 });
  });

  test.each([null, [], 'none', { extraRounds: -1 }, { extraRounds: 3 }, { extraRounds: 0.5 },
    { extraRounds: '1' }, { extraRounds: undefined }, { starterRotation: 'reverse' },
    { treePreset: 'toString' }, { treePreset: 'unknown' }, { extra: true }])('rejects malformed options: %j', input => {
    expect(() => normalizeStandardOptions(input)).toThrow();
  });

  test('normalizes all 108 configuration/player-count cases', () => {
    let count = 0;
    for (const players of [2, 3, 4]) for (const starterRotation of ['none', 'clockwise', 'counterclockwise']) {
      for (const extraRounds of [0, 1, 2]) for (const treePreset of Object.keys(TREE_PRESETS)) {
        const options = normalizeStandardOptions({ starterRotation, extraRounds, treePreset });
        expect(standardRoundCount(players, options)).toBe(9 - players + extraRounds);
        expect(TREE_PRESETS[options.treePreset].thresholds).toHaveLength(5);
        count++;
      }
    }
    expect(count).toBe(108);
  });
});
