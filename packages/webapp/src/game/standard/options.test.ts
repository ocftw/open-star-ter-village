import { DEFAULT_STANDARD_OPTIONS, FEATURE_KEYS, normalizeStandardOptions, PROTOTYPE_FEATURES, standardOptionsLabel, standardRoundCount, TREE_PRESETS } from './options';
import { roomSetupError } from './config';

describe('Standard room options', () => {
  test('server rejects options on Simplified and unknown setup keys', () => {
    expect(roomSetupError({ ruleset: 'simple', standardOptions: {} }, 3)).toBeDefined();
    expect(roomSetupError({ ruleset: 'tree-poc-v1', typo: true }, 3)).toBeDefined();
    expect(roomSetupError({ ruleset: 'tree-poc-v1', standardOptions: { extraRounds: 0.5 } }, 3)).toBeDefined();
  });
  test('defaults are copied and omitted fields retain defaults', () => {
    const value = normalizeStandardOptions(undefined);
    expect(value).toEqual(DEFAULT_STANDARD_OPTIONS);
    expect(value).not.toBe(DEFAULT_STANDARD_OPTIONS);
    expect(normalizeStandardOptions({ extraRounds: 2 })).toEqual({ ...DEFAULT_STANDARD_OPTIONS, extraRounds: 2 });
  });

  test.each([null, [], 'none', { extraRounds: -1 }, { extraRounds: 3 }, { extraRounds: 0.5 },
    { extraRounds: '1' }, { extraRounds: undefined }, { starterRotation: 'reverse' },
    { treePreset: 'toString' }, { treePreset: 'unknown' }, { treeConnections: 'v3' }, { government1: 'toString' }, { government2: 'contract' }, { sources: '' }, { treeRules: 'v2-collab' }, { extra: true }])('rejects malformed options: %j', input => {
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

  test('each prototype feature defaults to its original rule and is chosen on its own', () => {
    const base = '先手不輪替 · 額外 0 輪 · 結案數 0／0／2／4／6';
    expect(normalizeStandardOptions({})).toMatchObject({ treeConnections: 'arrows', government1: 'redraw', government2: 'preview', sources: 'engineer' });
    expect(standardOptionsLabel(normalizeStandardOptions({}))).toBe(base);
    for (const key of FEATURE_KEYS) {
      const values = PROTOTYPE_FEATURES[key].values as Record<string, string>;
      for (const value of Object.keys(values).filter(v => v !== DEFAULT_STANDARD_OPTIONS[key])) {
        const options = normalizeStandardOptions({ [key]: value });
        expect(FEATURE_KEYS.filter(other => options[other] !== DEFAULT_STANDARD_OPTIONS[other])).toEqual([key]);
        expect(standardOptionsLabel(options)).toBe(`${base} · ${PROTOTYPE_FEATURES[key].label}：${values[value]}`);
      }
    }
    // Rooms created before the features existed keep the original label.
    const { treeConnections: _a, government1: _b, government2: _c, sources: _d, ...older } = DEFAULT_STANDARD_OPTIONS;
    expect(standardOptionsLabel(older as typeof DEFAULT_STANDARD_OPTIONS)).toBe(base);
    // Rooms created with a treeRules bundle list the bundle's features.
    expect(standardOptionsLabel({ ...older, treeRules: 'v2-maintenance' } as unknown as typeof DEFAULT_STANDARD_OPTIONS))
      .toBe(`${base} · 星源樹連線：依層級 · 政府 1：開放標案 · 政府 2：維運合約 · 開源 3／4：主力職能`);
  });
});
