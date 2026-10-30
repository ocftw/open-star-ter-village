'use client';
import React from 'react';
import type { GameContext } from '../GameContextHelpers';
import { getPlayerName } from '../playerNameMap';
import { GAME_SERVER_URL } from '@/lib/lobbyClient';
import { buildStandardExport } from '@/game/standard/export';
import type { StandardTelemetry } from '@/game/standard/telemetry';
import { StickerButton } from '../design';

const cell: React.CSSProperties = { padding: '4px 10px', textAlign: 'left', verticalAlign: 'top', borderBottom: '1px solid var(--ink-mute)' };

/** True when the page was opened with `?debug=1`. */
export function useDebugMode(): boolean {
  const [debug, setDebug] = React.useState(false);
  React.useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).get('debug') === '1');
  }, []);
  return debug;
}

/**
 * Debug-only view of server-side balance telemetry. Renders nothing unless the
 * game server runs with DEBUG_TELEMETRY=1 and serves the debug endpoint.
 */
export default function DebugTelemetryPanel({ gameContext }: { gameContext: GameContext }) {
  const { G, ctx, matchID, matchData } = gameContext;
  const [telemetry, setTelemetry] = React.useState<StandardTelemetry | null>(null);
  const logLength = G.standard?.log.length ?? 0;

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${GAME_SERVER_URL}/debug/matches/${encodeURIComponent(matchID)}/telemetry`)
      .then(response => (response.ok ? response.json() : null))
      .then(body => { if (!cancelled) setTelemetry(body?.telemetry ?? null); })
      .catch(() => { if (!cancelled) setTelemetry(null); });
    return () => { cancelled = true; };
  }, [matchID, logLength, ctx.turn]);

  if (!telemetry || !G.standard) return null;
  const name = (id?: string) => (id === undefined ? '—' : getPlayerName(matchData, id));
  const projects = Object.entries(telemetry.projects);

  function exportWithTelemetry() {
    const summary = buildStandardExport(G, ctx, { build: process.env.NEXT_PUBLIC_BUILD_SHA ?? 'local', telemetry: telemetry! });
    const url = URL.createObjectURL(new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `tree-poc-${matchID}-debug.json`; a.click(); URL.revokeObjectURL(url);
  }

  return <section className="paper-card" data-testid="debug-telemetry" aria-label="除錯：平衡數據" style={{ padding: 16, margin: 12, fontSize: 13 }}>
    <h3>除錯模式 · 平衡數據</h3>
    <p>政府5 預算 {telemetry.government5.used}／{telemetry.government5.budget} 點已使用 · 進階抽牌 {Object.entries(telemetry.advancedDraws).map(([id, n]) => `${name(id)} ${n}`).join('、') || '無'}</p>
    <p>首次超過 20 影響力：{Object.entries(telemetry.firstOver20Round).map(([id, round]) => `${name(id)} 第 ${round} 輪`).join('、') || '尚無'}</p>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: 520 }}>
        <thead><tr>{['專案', '星數', '發起', '結案', '貢獻快照'].map(h => <th key={h} style={cell}>{h}</th>)}</tr></thead>
        <tbody>{projects.map(([id, p]) => <tr key={id}>
          <td style={cell}>{p.name}</td><td style={cell}>{p.difficulty}</td><td style={cell}>{name(p.initiator)} · 第 {p.initiatedRound} 輪</td>
          <td style={cell}>{p.finisher === undefined ? '進行中' : `${name(p.finisher)} · 第 ${p.completedRound} 輪`}</td>
          <td style={cell}>{p.contributions ? Object.entries(p.contributions).map(([pid, v]) => `${name(pid)} ${v}`).join('、') : '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p>選擇：{Object.entries(telemetry.choices).map(([kind, c]) => `${kind} 佇列 ${c!.queued}／完成 ${c!.resolved}／略過 ${c!.skipped}／無目標 ${c!.noTarget}`).join('；') || '無'}</p>
    <StickerButton variant="ghost" size="sm" onClick={exportWithTelemetry}>匯出含平衡數據的摘要</StickerButton>
  </section>;
}
