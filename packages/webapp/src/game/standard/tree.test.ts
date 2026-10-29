import { normalizeStandardOptions, type TreeRules } from './options';
import type { NodeId } from './state';
import { advancedScoreGate, isConnected, mainJobs, NODE_LABELS, nodeLabels, NODES, nodesConnectedBy, predecessors, treeRules } from './tree';
import type { GameState } from '../store/store';

type TreeState = Pick<GameState, 'standard'>;
function tree(rules: TreeRules | undefined, grown: NodeId[] = []): TreeState {
  const options = rules ? normalizeStandardOptions({ treeRules: rules }) : { ...normalizeStandardOptions({}), treeRules: undefined };
  return { standard: { options, grown } } as unknown as TreeState;
}
const V2: TreeRules[] = ['v2-collab', 'v2-maintenance'];

describe('tree rules', () => {
  test('matches without tree rules play v1', () => {
    expect(treeRules(tree(undefined))).toBe('v1');
    expect(treeRules({ standard: undefined } as TreeState)).toBe('v1');
  });

  test('v1 keeps the diagonal connections', () => {
    for (const node of NODES) {
      expect(isConnected(tree('v1'), node)).toBe(node.endsWith('-1'));
      for (const pre of predecessors(node)) expect(isConnected(tree('v1', [pre]), node)).toBe(true);
      expect(nodesConnectedBy(tree('v1'), node)).toEqual(NODES.filter(next => predecessors(next).includes(node)));
    }
    // government-2 connects only from government-1, never from source-1.
    expect(isConnected(tree('v1', ['source-1']), 'government-2')).toBe(false);
  });

  test.each(V2)('%s connects a node to any grown node one tier down', rules => {
    expect(isConnected(tree(rules, ['source-1']), 'government-2')).toBe(true);
    expect(isConnected(tree(rules, ['government-3']), 'source-4')).toBe(true);
    expect(isConnected(tree(rules, ['source-1']), 'source-3')).toBe(false);
    expect(isConnected(tree(rules), 'data-1')).toBe(true);
    expect(nodesConnectedBy(tree(rules), 'data-2')).toEqual(['source-3', 'data-3', 'government-3']);
    expect(nodesConnectedBy(tree(rules), 'government-5')).toEqual([]);
  });

  test('the advanced gate drops to 10 only once a v2 Government 1 is grown', () => {
    expect(advancedScoreGate(tree('v1', ['government-1']))).toBe(20);
    for (const rules of V2) {
      expect(advancedScoreGate(tree(rules))).toBe(20);
      expect(advancedScoreGate(tree(rules, ['government-1']))).toBe(10);
    }
  });

  test('labels change only for the replaced abilities', () => {
    expect(nodeLabels(tree('v1'))).toBe(NODE_LABELS);
    const collab = nodeLabels(tree('v2-collab')), maintenance = nodeLabels(tree('v2-maintenance'));
    expect(collab.source.slice(2, 4)).toEqual(['主力職能發起貢獻 1 → 3', '結案者推進任一方塊 1 點']);
    expect(collab.government.slice(0, 2)).toEqual(['進階專案門檻 20 → 10', '3★+ 結案協助者各 +2']);
    expect(maintenance.government[1]).toBe('3★+ 結案後發起人每輪 +1');
    expect(collab.data).toEqual(NODE_LABELS.data);
    expect(collab.government.slice(2)).toEqual(NODE_LABELS.government.slice(2));
  });

  test('main jobs are every job tied for the largest requirement', () => {
    expect(mainJobs({ requirements: { 工程師: 4, 美術設計: 2 } })).toEqual(['工程師']);
    expect(mainJobs({ requirements: { 法務專家: 6, 公務人員: 6, 工程師: 2 } })).toEqual(['法務專家', '公務人員']);
  });
});
