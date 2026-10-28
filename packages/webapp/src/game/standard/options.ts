export const TREE_PRESETS = {
  'count-00246': { metric: 'count', thresholds: [0, 0, 2, 4, 6] },
  'cc-00246': { metric: 'cc', thresholds: [0, 0, 2, 4, 6] },
  'cc-00369': { metric: 'cc', thresholds: [0, 0, 3, 6, 9] },
  'cc-013610': { metric: 'cc', thresholds: [0, 1, 3, 6, 10] },
} as const;

export interface StandardOptions {
  starterRotation: 'none' | 'clockwise' | 'counterclockwise';
  extraRounds: 0 | 1 | 2;
  treePreset: keyof typeof TREE_PRESETS;
}

export const DEFAULT_STANDARD_OPTIONS: Readonly<StandardOptions> = {
  starterRotation: 'none', extraRounds: 0, treePreset: 'count-00246',
};

/** A single strict normalizer for room setup and simulation input. */
export function normalizeStandardOptions(input: unknown): StandardOptions {
  if (input === undefined) return { ...DEFAULT_STANDARD_OPTIONS };
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid Standard options');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !Object.prototype.hasOwnProperty.call(DEFAULT_STANDARD_OPTIONS, key))) throw new Error('Unknown Standard option');
  const result = { ...DEFAULT_STANDARD_OPTIONS, ...value };
  if (!['none', 'clockwise', 'counterclockwise'].includes(result.starterRotation as string) ||
      ![0, 1, 2].includes(result.extraRounds as number) ||
      typeof result.treePreset !== 'string' || !Object.prototype.hasOwnProperty.call(TREE_PRESETS, result.treePreset)) {
    throw new Error('Invalid Standard options');
  }
  return result as StandardOptions;
}

export function standardRoundCount(players: number, options: StandardOptions): number {
  return 9 - players + options.extraRounds;
}

export function standardOptionsLabel(value?: StandardOptions): string {
  const options = value ?? DEFAULT_STANDARD_OPTIONS;
  const preset = TREE_PRESETS[options.treePreset];
  const rotation = { none: '不輪替', clockwise: '順時針', counterclockwise: '逆時針' }[options.starterRotation];
  return `先手${rotation} · 額外 ${options.extraRounds} 輪 · ${preset.metric === 'cc' ? '結案複雜度 CC' : '結案數'} ${preset.thresholds.join('／')}`;
}
