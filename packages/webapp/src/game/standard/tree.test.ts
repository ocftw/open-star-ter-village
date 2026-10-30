import { FEATURE_BUNDLES, normalizeStandardOptions, type PrototypeFeatures } from './options';
import type { NodeId } from './state';
import { advancedScoreGate, feature, isConnected, mainJobs, NODE_LABELS, nodeLabels, NODES, nodesConnectedBy, predecessors } from './tree';
import type { GameState } from '../store/store';

type TreeState = Pick<GameState, 'standard'>;
function tree(features: Partial<PrototypeFeatures> = {}, grown: NodeId[] = []): TreeState {
  return { standard: { options: normalizeStandardOptions(features), grown } } as unknown as TreeState;
}
const TIERS = { treeConnections: 'tiers' } as const;
const OPEN_TENDER = { government1: 'open-tender' } as const;

describe('prototype features', () => {
  test('matches without a feature play its original rule', () => {
    const { treeConnections: _omitted, ...older } = normalizeStandardOptions({});
    expect(feature({ standard: { options: older } } as unknown as TreeState, 'treeConnections')).toBe('arrows');
    expect(feature({ standard: undefined } as TreeState, 'government2')).toBe('preview');
  });

  test('matches created with a treeRules bundle play its features', () => {
    const legacy = (treeRules: string) => ({ standard: { options: { starterRotation: 'none', extraRounds: 0, treePreset: 'count-00246', treeRules } } }) as unknown as TreeState;
    for (const key of ['treeConnections', 'government1', 'government2', 'sources'] as const) {
      expect(feature(legacy('v2-collab'), key)).toBe(FEATURE_BUNDLES['v2-collab'][key]);
      expect(feature(legacy('v2-maintenance'), key)).toBe(FEATURE_BUNDLES['v2-maintenance'][key]);
      expect(feature(legacy('v1'), key)).toBe(normalizeStandardOptions({})[key]);
    }
  });

  test('arrow connections keep the diagonals', () => {
    for (const node of NODES) {
      expect(isConnected(tree(), node)).toBe(node.endsWith('-1'));
      for (const pre of predecessors(node)) expect(isConnected(tree({}, [pre]), node)).toBe(true);
      expect(nodesConnectedBy(tree(), node)).toEqual(NODES.filter(next => predecessors(next).includes(node)));
    }
    // government-2 connects only from government-1, never from source-1.
    expect(isConnected(tree({}, ['source-1']), 'government-2')).toBe(false);
  });

  test('tier connections join a node to any grown node one tier down', () => {
    expect(isConnected(tree(TIERS, ['source-1']), 'government-2')).toBe(true);
    expect(isConnected(tree(TIERS, ['government-3']), 'source-4')).toBe(true);
    expect(isConnected(tree(TIERS, ['source-1']), 'source-3')).toBe(false);
    expect(isConnected(tree(TIERS), 'data-1')).toBe(true);
    expect(nodesConnectedBy(tree(TIERS), 'data-2')).toEqual(['source-3', 'data-3', 'government-3']);
    expect(nodesConnectedBy(tree(TIERS), 'government-5')).toEqual([]);
  });

  test('the advanced gate drops to 10 only with 開放標案 grown, whatever the other features', () => {
    expect(advancedScoreGate(tree({}, ['government-1']))).toBe(20);
    expect(advancedScoreGate(tree(FEATURE_BUNDLES['v2-collab'], ['source-1']))).toBe(20);
    expect(advancedScoreGate(tree({ ...TIERS, government2: 'collab', sources: 'main-job' }, ['government-1']))).toBe(20);
    expect(advancedScoreGate(tree(OPEN_TENDER))).toBe(20);
    expect(advancedScoreGate(tree(OPEN_TENDER, ['government-1']))).toBe(10);
  });

  test('each feature relabels only its own abilities', () => {
    expect(nodeLabels(tree())).toEqual(NODE_LABELS);
    expect(nodeLabels(tree(TIERS))).toEqual(NODE_LABELS);
    const sources = nodeLabels(tree({ sources: 'main-job' }));
    expect(sources.source.slice(2, 4)).toEqual(['主力職能發起貢獻 1 → 3', '結案者推進任一職能方塊 1 點']);
    expect(sources.government).toEqual(NODE_LABELS.government);
    const tender = nodeLabels(tree(OPEN_TENDER));
    expect(tender.government).toEqual(['進階專案門檻 20 → 10', ...NODE_LABELS.government.slice(1)]);
    expect(tender.source).toEqual(NODE_LABELS.source);
    expect(nodeLabels(tree({ government2: 'collab' })).government[1]).toBe('3★+ 結案協助者各 +2');
    expect(nodeLabels(tree({ government2: 'maintenance' })).government).toEqual([NODE_LABELS.government[0], '3★+ 結案後發起人每輪 +1', ...NODE_LABELS.government.slice(2)]);
    expect(nodeLabels(tree(FEATURE_BUNDLES['v2-collab'])).data).toEqual(NODE_LABELS.data);
  });

  test('main jobs are every job tied for the largest requirement', () => {
    expect(mainJobs({ requirements: { 工程師: 4, 美術設計: 2 } })).toEqual(['工程師']);
    expect(mainJobs({ requirements: { 法務專家: 6, 公務人員: 6, 工程師: 2 } })).toEqual(['法務專家', '公務人員']);
  });
});
