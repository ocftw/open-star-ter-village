import type { ClientGameState, GameState } from '../store/store';
import type { Branch, NodeId } from './state';
export const BRANCHES: Branch[] = ['source', 'data', 'government'];
export const THRESHOLDS = [0, 0, 2, 4, 6];
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
export function growthReason(G: GameState | ClientGameState, node: NodeId, playerId: string, overtime = false): string | undefined {
  const s = G.standard;
  if (!s || !NODES.includes(node)) return '無效能力';
  if (s.phase !== 'action' || s.choices.length) return '請先完成待處理選擇';
  if (s.grown.includes(node)) return '已成長';
  if (s.grown.length >= 10) return '愛心已用完';
  const tier = Number(node.split('-')[1]);
  if (s.grown.filter(n => n.endsWith(`-${tier}`)).length >= 2) return '本層已滿 2 顆';
  if (s.completedProjectIds.length < THRESHOLDS[tier - 1]) return `需要全村結案 ${THRESHOLDS[tier - 1]}`;
  if (tier > 1 && !predecessors(node).some(n => s.grown.includes(n))) return '沒有相連下層能力';
  if (!G.players[playerId] || G.players[playerId].token.actions < 1) return '需要 1 行動點';
  if (s.growthUsed && !overtime) return '本回合已成長；可使用加班';
  if (overtime && (!s.growthUsed || G.players[playerId].token.overtime < 1)) return '無法使用加班';
}
