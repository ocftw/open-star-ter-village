import { standardEvent } from './events';
import type { ClientGameState, GameState } from '../store/store';
import type { Branch, NodeId } from './state';
import { DEFAULT_STANDARD_OPTIONS, FEATURE_BUNDLES, TREE_PRESETS, type FeatureBundle, type PrototypeFeature, type PrototypeFeatures, type StandardOptions } from './options';
export const BRANCHES: Branch[] = ['source', 'data', 'government'];
export const THRESHOLDS = [0, 0, 2, 4, 6];
export function treeProgress(G: Pick<GameState, 'standard'>) {
  const preset = TREE_PRESETS[G.standard?.options?.treePreset ?? 'count-00246'];
  return { ...preset, value: preset.metric === 'cc' ? (G.standard?.completedComplexity ?? 0) : (G.standard?.completedProjectIds.length ?? 0) };
}
export const REWARDS = [1, 1, 2, 2, 4];
export const NODE_LABELS: Record<Branch, string[]> = {
  source: ['人力區 6 → 8', '協助貢獻 4 → 5', '工程師發起貢獻 1 → 3', '結案者推進另一工程師 1 點', '發起花費 2 → 1 AP'],
  data: ['手牌上限 2 → 3', '招募貢獻 1 → 2', '行動點 3 → 4', '發起人貢獻 3 → 4', '任一人力卡皆可發起'],
  government: ['回合結束可棄 1 張再補', '預覽下一事件', '專案空間 6 → 8', '發起後免費招募至另一專案', '發起人結案貢獻的一半分配'],
};
export const NODES = BRANCHES.flatMap(branch => [1, 2, 3, 4, 5].map(tier => `${branch}-${tier}` as NodeId));
export function predecessors(node: NodeId): NodeId[] {
  const [branch, tierString] = node.split('-');
  const tier = Number(tierString);
  if (tier === 1) return [];
  const index = BRANCHES.indexOf(branch as Branch);
  const diagonal = tier % 2 === 0 ? index + 1 : index - 1;
  return [index, diagonal].filter(i => i >= 0 && i < 3).map(i => `${BRANCHES[i]}-${tier - 1}` as NodeId);
}
export function hasNode(G: Pick<GameState, 'standard'>, node: NodeId): boolean {
  return G.standard?.grown.includes(node) ?? false;
}

// ---------- prototype features ----------
const FEATURE_LABELS: Partial<Record<NodeId, (G: Pick<GameState, 'standard'>) => string | undefined>> = {
  'source-3': G => feature(G, 'sources') === 'main-job' ? '主力職能發起貢獻 1 → 3' : undefined,
  'source-4': G => feature(G, 'sources') === 'main-job' ? '結案者推進任一職能方塊 1 點' : undefined,
  'government-1': G => feature(G, 'government1') === 'open-tender' ? '進階專案門檻 20 → 10' : undefined,
  'government-2': G => ({ preview: undefined, collab: '3★+ 結案協助者各 +2', maintenance: '3★+ 結案後發起人每輪 +1' })[feature(G, 'government2')],
};
const tierOf = (node: NodeId) => Number(node.split('-')[1]);

/** A match's choice for one prototype feature. Matches created with a `treeRules` bundle play its features; older ones the original rules. */
export function feature<F extends PrototypeFeature>(G: Pick<GameState, 'standard'>, key: F): PrototypeFeatures[F] {
  const options = G.standard?.options as (Partial<StandardOptions> & { treeRules?: FeatureBundle }) | undefined;
  const bundle: Partial<StandardOptions> = (options?.treeRules && FEATURE_BUNDLES[options.treeRules]) || {};
  return options?.[key] ?? bundle[key] ?? DEFAULT_STANDARD_OPTIONS[key];
}
/** Whether `node` is joined to a grown lower tier: by arrows through its own predecessors, by tiers through any node one tier down. */
export function isConnected(G: Pick<GameState, 'standard'>, node: NodeId): boolean {
  const tier = tierOf(node), grown = G.standard?.grown ?? [];
  if (tier === 1) return true;
  if (feature(G, 'treeConnections') === 'arrows') return predecessors(node).some(n => grown.includes(n));
  return grown.some(n => tierOf(n) === tier - 1);
}
/** Nodes that growing `node` would join to the tree. */
export function nodesConnectedBy(G: Pick<GameState, 'standard'>, node: NodeId): NodeId[] {
  const tier = tierOf(node);
  if (feature(G, 'treeConnections') === 'arrows') return NODES.filter(next => predecessors(next).includes(node));
  return NODES.filter(next => tierOf(next) === tier + 1);
}
export function nodeLabels(G: Pick<GameState, 'standard'>): Record<Branch, string[]> {
  return Object.fromEntries(BRANCHES.map(branch => [branch, NODE_LABELS[branch].map((text, i) => FEATURE_LABELS[`${branch}-${i + 1}` as NodeId]?.(G) ?? text)])) as Record<Branch, string[]>;
}
/** The advanced pile is drawable by a player whose score is above this. */
export function advancedScoreGate(G: Pick<GameState, 'standard'>): number {
  return feature(G, 'government1') === 'open-tender' && hasNode(G, 'government-1') ? 10 : 20;
}
/** The jobs a card needs most; every tied job counts. */
export function mainJobs(card: { requirements: Record<string, number> }): string[] {
  const top = Math.max(...Object.values(card.requirements));
  return Object.keys(card.requirements).filter(job => card.requirements[job] === top);
}
export function growthReason(G: GameState | ClientGameState, node: NodeId, playerId: string, overtime = false): string | undefined {
  const s = G.standard;
  if (!s || !NODES.includes(node)) return '無效能力';
  if (s.phase !== 'action' || s.choices.length) return '請先完成待處理選擇';
  if (standardEvent(G, 'no_tree_growth')) return '又老又窮啊：本輪不可成長';
  if (overtime && standardEvent(G, 'no_overtime')) return '減薪休假啊：本輪不可加班';
  if (s.grown.includes(node)) return '已成長';
  if (s.grown.length >= 10) return '愛心已用完';
  const tier = Number(node.split('-')[1]);
  if (s.grown.filter(n => n.endsWith(`-${tier}`)).length >= 2) return '本層已滿 2 顆';
  const progress = treeProgress(G);
  if (progress.value < progress.thresholds[tier - 1]) return `需要全村${progress.metric === 'cc' ? '結案複雜度 CC' : '結案數'} ${progress.thresholds[tier - 1]}`;
  if (!isConnected(G, node)) return '沒有相連下層能力';
  if (!G.players[playerId] || G.players[playerId].token.actions < 1) return '需要 1 行動點';
  if (s.growthUsed && !overtime) return '本回合已成長；可使用加班';
  if (overtime && (!s.growthUsed || G.players[playerId].token.overtime < 1)) return '無法使用加班';
}
