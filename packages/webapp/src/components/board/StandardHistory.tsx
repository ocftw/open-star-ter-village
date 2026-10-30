'use client';
import type { PublicLog } from '@/game/standard/state';

const labels: Record<string, string> = {
  createProject: '發起專案', recruit: '招募人力', contributeOwnedProjects: '發起人貢獻',
  contributeJoinedProjects: '協助貢獻', removeAndRefillJobs: '更新人力區', endActionTurn: '結束行動',
  discardExcessJobCards: '四大自由移除人力', grow: '星源樹成長', complete: '專案結案',
  event: '揭示事件', eventEffect: '事件效果與場況', score: '影響力',
  digitalMinister: '數位政委', government4: '政府 4 招募', government5: '政府 5 分配',
  source4: '開源 4 推進', extraRecruit: '額外招募', discard: '棄掉一張手牌', draw: '補充手牌',
};

export default function StandardHistory({ entries, playerName }: { entries: PublicLog[]; playerName: (id: string) => string }) {
  return <details style={{ margin: '12px 0' }}>
    <summary>公開遊戲歷程（{entries.length} 筆）</summary>
    <ol aria-label="公開遊戲歷程" style={{ maxHeight: 360, overflowY: 'auto', paddingLeft: 24, overflowWrap: 'anywhere' }}>
      {entries.map((entry, index) => <li key={entry.sequence ?? index} style={{ marginBottom: 10 }}>
        第 {entry.round} 輪 · {entry.playerId !== undefined ? `${playerName(entry.playerId)} · ` : ''}
        {labels[entry.kind.replace(':skip', '')] ?? entry.kind}{entry.kind.endsWith(':skip') ? '（略過）' : ''}
        {entry.scoreDelta !== undefined ? ` ${entry.scoreDelta >= 0 ? '+' : ''}${entry.scoreDelta}` : ''}
        {entry.target ? `：${entry.target.replace(/\b(source|data|government)-([1-5])\b/g, (_, branch: string, tier: string) => `${({source:'開源',data:'資料',government:'政府'} as Record<string,string>)[branch]} ${tier}`)}` : ''}
        {entry.projects?.map(project => <div key={project.id}>{project.name}：{project.contributions.map(cube => `${playerName(cube.worker)}／${cube.jobName} ${cube.value}`).join('、')}</div>)}
        {entry.market && <div>人力區：{entry.market.join('、')}</div>}
        {entry.actionPoints && <div>行動點：{Object.entries(entry.actionPoints).map(([id, points]) => `${playerName(id)} ${points}`).join('、')}</div>}
      </li>)}
    </ol>
  </details>;
}
