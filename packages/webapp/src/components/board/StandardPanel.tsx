'use client';
import React from 'react';
import type { GameContext } from '../GameContextHelpers';
import { getPlayerName } from '../playerNameMap';
import { BRANCHES, NODES, NODE_LABELS, THRESHOLDS, REWARDS, predecessors, growthReason } from '@/game/standard/tree';
import { choiceOptions, ChoiceTarget } from '@/game/standard/engine';
import type { NodeId } from '@/game/standard/state';
import { buildStandardExport, treeOutcome } from '@/game/standard/export';
import { StickerButton } from '../design';

const branchLabels = ['開源', '資料', '政府'];
export default function StandardPanel({ gameContext }: { gameContext: GameContext }) {
  const { G, ctx, playerID, moves, matchData } = gameContext;
  const [selected, setSelected] = React.useState<NodeId | null>(null);
  const [overtime, setOvertime] = React.useState(false);
  const s = G.standard;
  if (!s) return null;
  const choice = s.choices[0];
  const active = playerID === ctx.currentPlayer && !ctx.gameover && !choice && s.phase === 'action';
  const moveApi = moves as unknown as { growTree: (id: NodeId, overtime: boolean) => void; resolveStandardChoice: (id: number, target: ChoiceTarget | null) => void };
  const reason = selected && playerID ? growthReason(G, selected, playerID, overtime) : undefined;
  const remaining = 10 - s.grown.length;
  const outcome = treeOutcome(remaining);
  function exportSummary() {
    const summary = buildStandardExport(G, ctx, { build: process.env.NEXT_PUBLIC_BUILD_SHA ?? 'local' });
    const url = URL.createObjectURL(new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `tree-poc-${gameContext.matchID}.json`; a.click(); URL.revokeObjectURL(url);
  }
  return <section className="paper-card" style={{ padding: 16, margin: 12 }} aria-label="星源樹測試版 v1">
    <h2>標準模式 · 星源樹測試版 v1</h2>
    <p>全村結案 {s.completedProjectIds.length} · 愛心剩餘 {remaining} · 第 {s.round} 輪 · {playerID !== null ? `行動點 ${G.players[playerID].token.actions}` : '觀戰'}</p>
    {s.nextEvent && <p>下一事件：{s.nextEvent.name} — {s.nextEvent.description}</p>}
    <details><summary>測試規則與能力連線</summary>
      <p>2–4 人；專案類型不影響規則。每層最多 2 顆；成長花 1 AP。同一分支可向上成長，跨分支須依箭頭方向。第 3／4／5 層需要全村結案 {THRESHOLDS.slice(2).join("／")} 個專案。每種行動一回合一次，加班可重複一次 1 AP 行動。</p>
      <p>數位政委：每個專案的發起人可選任一玩家的 1 個方塊前進 1 格。推進完成時，方塊擁有者獲結案獎勵。政府5：貢獻一半向下取整，分配至自己的既有方塊，不超過需求。</p>
      <p>影響力超過 20 可抽進階卡；結案專案不回牌堆。重新整理可恢復座位；伺服器重啟會失去本局。</p>
    </details>
    <div style={{ overflowX: 'auto', margin: '12px 0' }}>
      <div style={{ minWidth: 450, position: 'relative' }}>
        <svg aria-hidden="true" viewBox="0 0 600 500" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs><marker id="tree-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
          {NODES.flatMap(n => predecessors(n).map(p => {
            const [b, t] = n.split('-'); const [pb, pt] = p.split('-');
            const x = BRANCHES.indexOf(b as typeof BRANCHES[number]) * 200 + 100;
            const px = BRANCHES.indexOf(pb as typeof BRANCHES[number]) * 200 + 100;
            return <line key={`${p}:${n}`} x1={px} y1={(5 - Number(pt)) * 100 + 12} x2={x} y2={(5 - Number(t)) * 100 + 88} stroke="currentColor" strokeWidth="1.5" strokeDasharray={b === pb ? undefined : '4 3'} markerEnd="url(#tree-arrow)" />;
          }))}
        </svg>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[5,4,3,2,1].flatMap(tier => BRANCHES.map((branch, index) => {
            const node = `${branch}-${tier}` as NodeId;
            const grown = s.grown.includes(node);
            const locked = playerID !== null ? growthReason(G, node, playerID, overtime) : '觀戰';
            return <div key={node} style={{ height: 100, padding: '13px 5px', position: 'relative' }}>
              <button type="button" data-testid={`tree-${node}`} aria-pressed={selected === node} onClick={() => setSelected(node)} style={{ width: '100%', height: '100%', background: grown ? 'var(--teal-soft)' : 'var(--paper)', border: selected === node ? '3px solid var(--orange)' : '1px solid var(--ink)', borderRadius: 8, fontSize: 12 }}>
                {branchLabels[index]} {tier} · {grown ? '♥ 已成長' : !locked && active ? '可成長' : '鎖定'}<br/>{NODE_LABELS[branch][tier - 1]}<br/>結案 ≥{THRESHOLDS[tier - 1]} · +{REWARDS[tier - 1]} 影響力
              </button>
            </div>;
          }))}
        </div>
      </div>
    </div>
    {selected && <div aria-live="polite">
      <p>{selected}：{reason ?? (active ? '可成長，花費 1 AP' : '等待你的行動回合')}</p>
      <label><input type="checkbox" checked={overtime} onChange={e => setOvertime(e.target.checked)} />使用加班</label>{' '}
      <StickerButton disabled={!active || !!reason} onClick={() => { moveApi.growTree(selected, overtime); setSelected(null); setOvertime(false); }}>確認成長 · 1 AP</StickerButton>
    </div>}
    {choice && <div role="region" aria-label="待處理選擇" aria-live="polite" style={{ padding: 12, border: '2px solid var(--orange)', marginTop: 12 }}>
      <h3>{{ extraRecruit: '抱歉了我的肝：可免費再招募一次', digitalMinister: '數位政委：選擇 1 個貢獻方塊', government4: '政府4：免費招募至另一專案', source4: '開源4：推進另一工程師', government5: `政府5：剩餘 ${choice.budget} 點`, discard: '政府1：可棄 1 張專案卡', draw: '選擇補牌來源' }[choice.kind]}</h3>
      <p>等待 {getPlayerName(matchData, choice.playerId)} 選擇</p>
      {choice.playerId === playerID && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {choiceOptions(G, choice).map((option, index) => <StickerButton key={`${choice.id}:${index}`} size="sm" variant="ghost" onClick={() => moveApi.resolveStandardChoice(choice.id, option.target)}>{option.label}</StickerButton>)}
        {choice.kind !== 'draw' && <StickerButton onClick={() => moveApi.resolveStandardChoice(choice.id, null)}>略過</StickerButton>}
      </div>}
    </div>}
    {ctx.gameover && <p>集體成果：{outcome}</p>}
    <StickerButton variant="ghost" size="sm" onClick={exportSummary}>匯出公開測試摘要</StickerButton>
  </section>;
}
