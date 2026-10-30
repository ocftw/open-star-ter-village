export const TREE_PRESETS = {
  'count-00246': { metric: 'count', thresholds: [0, 0, 2, 4, 6] },
  'cc-00246': { metric: 'cc', thresholds: [0, 0, 2, 4, 6] },
  'cc-00369': { metric: 'cc', thresholds: [0, 0, 3, 6, 9] },
  'cc-013610': { metric: 'cc', thresholds: [0, 1, 3, 6, 10] },
} as const;

/**
 * Prototype features, each chosen on its own when a room is created. Each
 * feature's first value is the original rule; `hint` explains the others.
 */
export const PROTOTYPE_FEATURES = {
  treeConnections: {
    label: '星源樹連線',
    values: { arrows: '依箭頭', tiers: '依層級' },
    hint: '依層級：下一層任一能力已成長，即可成長本層任一能力。',
  },
  government1: {
    label: '政府 1',
    values: { redraw: '棄 1 再補', 'open-tender': '開放標案' },
    hint: '開放標案：政府 1 成長後，影響力超過 10（原為 20）即可抽進階卡。',
  },
  government2: {
    label: '政府 2',
    values: { preview: '預覽事件', collab: '協作合約', maintenance: '維運合約' },
    hint: '協作合約：3★/4★ 結案時，每位有方塊的協助者 +2。維運合約：發起人結案 3★/4★ 後，之後每輪結束 +1。',
  },
  sources: {
    label: '開源 3／4',
    values: { engineer: '工程師', 'main-job': '主力職能' },
    hint: '主力職能：以卡片最需要的職能發起時起始貢獻 3；結案者可推進自己任一職能的方塊 1 點。',
  },
} as const;
export type PrototypeFeature = keyof typeof PROTOTYPE_FEATURES;
export type FeatureValue<F extends PrototypeFeature> = keyof typeof PROTOTYPE_FEATURES[F]['values'];
export type PrototypeFeatures = { [F in PrototypeFeature]: FeatureValue<F> };
export const FEATURE_KEYS = Object.keys(PROTOTYPE_FEATURES) as PrototypeFeature[];

/** The feature sets of the first tree v2 prototype: sweep presets, and how matches created with `treeRules` play. */
export const FEATURE_BUNDLES = {
  'v1': {},
  'v2-collab': { treeConnections: 'tiers', government1: 'open-tender', government2: 'collab', sources: 'main-job' },
  'v2-maintenance': { treeConnections: 'tiers', government1: 'open-tender', government2: 'maintenance', sources: 'main-job' },
} as const satisfies Record<string, Partial<PrototypeFeatures>>;
export type FeatureBundle = keyof typeof FEATURE_BUNDLES;

export interface StandardOptions extends PrototypeFeatures {
  starterRotation: 'none' | 'clockwise' | 'counterclockwise';
  extraRounds: 0 | 1 | 2;
  treePreset: keyof typeof TREE_PRESETS;
}

export const DEFAULT_STANDARD_OPTIONS: Readonly<StandardOptions> = {
  starterRotation: 'none', extraRounds: 0, treePreset: 'count-00246',
  treeConnections: 'arrows', government1: 'redraw', government2: 'preview', sources: 'engineer',
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
      typeof result.treePreset !== 'string' || !Object.prototype.hasOwnProperty.call(TREE_PRESETS, result.treePreset) ||
      FEATURE_KEYS.some(key => typeof result[key] !== 'string' || !Object.prototype.hasOwnProperty.call(PROTOTYPE_FEATURES[key].values, result[key] as string))) {
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
  // Matches created with a `treeRules` bundle play, and so list, its features.
  const legacy = (options as { treeRules?: FeatureBundle }).treeRules;
  const bundle: Partial<PrototypeFeatures> = (legacy && FEATURE_BUNDLES[legacy]) || {};
  const features = FEATURE_KEYS.map(key => [key, options[key] ?? bundle[key]] as const)
    .filter(([key, value]) => value && value !== DEFAULT_STANDARD_OPTIONS[key])
    .map(([key, value]) => ` · ${PROTOTYPE_FEATURES[key].label}：${(PROTOTYPE_FEATURES[key].values as Record<string, string>)[value!]}`).join('');
  return `先手${rotation} · 額外 ${options.extraRounds} 輪 · ${preset.metric === 'cc' ? '結案複雜度 CC' : '結案數'} ${preset.thresholds.join('／')}${features}`;
}
