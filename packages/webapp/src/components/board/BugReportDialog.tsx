import React from 'react';
import { createPortal } from 'react-dom';
import { toBlob } from 'html-to-image';
import { GameContext } from '@/components/GameContextHelpers';
import { StickerButton } from '@/components/design';
import { useAppSelector } from '@/lib/hooks';
import { getCurrentAction } from '@/lib/reducers/actionStepSlice';
import { PlayersSelector } from '@/game/store/slice/players';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { TableSelector } from '@/game/store/slice/table';
import { RuleSelector } from '@/game/store/slice/rule';
import { getPlayerName } from '@/components/playerNameMap';
import { ActionMoveName } from '@/game/core/stage/action/move/type';

const ISSUES_NEW_URL = 'https://github.com/ocftw/open-star-ter-village/issues/new';

export type BugReportState = 'closed' | 'open' | 'minimized';

type ScreenshotStatus = 'idle' | 'copying' | 'copied' | 'manual';

/** Auto game-state snapshot embedded in the prefilled issue (design: GpBugDialog). */
export function buildStateSnapshot(gameContext: GameContext, currentAction: string | null): string {
  const { G, ctx, playerID, matchData, matchID } = gameContext;
  const playerIDs = Object.keys(G.players);
  const nameOf = (id: string) => getPlayerName(matchData, id);
  const perPlayer = (value: (id: string) => number | string) =>
    playerIDs.map((id) => `${nameOf(id)} ${value(id)}`).join(' · ');
  const occupiedSlots = (Object.keys(G.table.actionSlots) as ActionMoveName[]).filter((name) =>
    ActionSlotSelector.isOccupied(G.table.actionSlots[name]),
  );

  return [
    `回合 Round: ${TableSelector.getRound(G.table)}/${G.rules ? RuleSelector.getTotalRounds(G.rules) : '?'}`,
    `現在玩家 Current player: ${nameOf(ctx.currentPlayer)}`,
    `進行中行動 Action in progress: ${currentAction ?? 'idle'}`,
    `AP: ${perPlayer((id) => PlayersSelector.getNumActionTokens(G.players, id))}`,
    `VP: ${perPlayer((id) => ScoreBoardSelector.getPlayerPoints(G.table.scoreBoard, id))}`,
    `工人 Workers: ${perPlayer((id) => PlayersSelector.getNumWorkerTokens(G.players, id))}`,
    `加班 Overtime: ${perPlayer((id) => PlayersSelector.getNumOvertimeTokens(G.players, id))}`,
    `行動格 Action slots used: ${occupiedSlots.join(', ') || 'none'}`,
    `Match: ${matchID} · seat ${playerID ?? 'observer'}`,
    `UA: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'}`,
  ].join('\n');
}

export function buildIssueUrl(description: string, snapshot: string): string {
  const firstLine = description.trim().split('\n')[0];
  const title = `[bug] ${firstLine || '遊戲問題回報'}`;
  const body = [
    '## 問題描述 Description',
    description.trim() || '(描述問題…)',
    '',
    '## 遊戲狀態 Game state',
    '```',
    snapshot,
    '```',
    '',
    '> 📸 請將截圖直接貼上（Ctrl/Cmd+V）到這裡 · Paste your screenshots here.',
  ].join('\n');
  const params = new URLSearchParams({ title, body, labels: 'bug' });
  return `${ISSUES_NEW_URL}?${params.toString()}`;
}

/**
 * In-game bug report (design: GpBugDialog): auto state snapshot + prefilled
 * GitHub issue + best-effort board-screenshot-to-clipboard. Minimizable to a
 * floating 🐞 chip so the player can inspect the board and take their own
 * screenshots mid-report; the draft survives minimize/restore.
 */
export default function BugReportDialog({
  gameContext,
  state,
  onMinimize,
  onRestore,
  onClose,
}: {
  gameContext: GameContext;
  state: Exclude<BugReportState, 'closed'>;
  onMinimize: () => void;
  onRestore: () => void;
  onClose: () => void;
}) {
  const currentAction = useAppSelector(getCurrentAction);
  const [description, setDescription] = React.useState('');
  const [screenshotStatus, setScreenshotStatus] = React.useState<ScreenshotStatus>('idle');
  const snapshot = buildStateSnapshot(gameContext, currentAction);
  const issueUrl = buildIssueUrl(description, snapshot);

  const handleCopyScreenshot = async () => {
    setScreenshotStatus('copying');
    try {
      // Hide the report UI itself from the capture.
      const blob = await toBlob(document.body, {
        filter: (node) =>
          !(node instanceof HTMLElement && node.dataset && 'bugReportUi' in node.dataset),
        pixelRatio: 1,
      });
      if (!blob || typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('clipboard image unsupported');
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setScreenshotStatus('copied');
    } catch {
      setScreenshotStatus('manual');
    }
  };

  // Portaled to <body>: the header that opens this dialog is a sticky
  // stacking context, which would otherwise confine the fixed overlay.
  if (state === 'minimized') {
    return createPortal(
      <button
        type="button"
        data-bug-report-ui=""
        data-testid="bug-report-chip"
        className="btn-sticker sm"
        onClick={onRestore}
        style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1500, background: 'var(--orange)' }}
        title="回到問題回報 · Resume bug report"
      >
        🐞 回報中…{' '}
        <span className="tag-en" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Resume
        </span>
      </button>,
      document.body,
    );
  }

  return createPortal(
    <div
      data-bug-report-ui=""
      data-testid="bug-report-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="回報問題"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(42, 36, 34, 0.4)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={onMinimize}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '2px solid var(--ink)',
          borderRadius: 22,
          boxShadow: 'var(--shadow-sticker)',
          width: 'min(560px, 100%)',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: 22,
          fontFamily: 'var(--font-zh)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            aria-hidden
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--orange)',
              border: '2px solid var(--ink)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 20,
              color: 'white',
            }}
          >
            🐞
          </span>
          <div>
            <strong style={{ fontSize: 17, color: 'var(--ink)' }}>回報問題</strong>
            <div className="en-cap">Report a bug</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="icon-btn"
              data-testid="bug-report-minimize"
              onClick={onMinimize}
              title="縮小視窗，先看盤面或自行截圖 · Minimize to inspect the board"
              aria-label="縮小 · Minimize"
            >
              ▁
            </button>
            <button
              type="button"
              className="icon-btn"
              data-testid="bug-report-close"
              onClick={onClose}
              aria-label="關閉 · Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
              發生了什麼事？ <span className="tag-en">What happened</span>
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              data-testid="bug-report-description"
              placeholder="例：我按了確認招募，但畫面沒有任何反應…"
              style={{
                width: '100%',
                minHeight: 80,
                border: '2px solid var(--ink)',
                borderRadius: 12,
                padding: 10,
                font: 'inherit',
                fontSize: 13,
                resize: 'vertical',
                background: 'white',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              background: 'white',
              border: '1.5px dashed var(--ink-mute)',
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <StickerButton
              variant="ghost"
              size="sm"
              onClick={() => void handleCopyScreenshot()}
              disabled={screenshotStatus === 'copying'}
              data-testid="bug-report-screenshot"
            >
              📸 {screenshotStatus === 'copying' ? '擷取中…' : '複製盤面截圖'}
            </StickerButton>
            <div
              style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5, minWidth: 0 }}
              data-testid="bug-report-screenshot-status"
              role="status"
            >
              {screenshotStatus === 'copied' &&
                '✅ 截圖已複製 — 開好 issue 後直接貼上（Ctrl/Cmd+V）。 · Screenshot copied; paste it into the issue.'}
              {screenshotStatus === 'manual' &&
                '無法自動複製 — 請先縮小此視窗，再用系統截圖工具（macOS ⌘⇧4 / Windows Win⇧S）自行擷取。 · Auto-copy unavailable; minimize and take a screenshot manually.'}
              {(screenshotStatus === 'idle' || screenshotStatus === 'copying') &&
                '也可以先縮小此視窗自行截圖，多張也沒問題。 · You can minimize this dialog and take your own screenshots.'}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
              遊戲狀態快照 <span className="tag-en">State snapshot（自動附在 issue）</span>
            </div>
            <pre
              data-testid="bug-report-snapshot"
              style={{
                background: 'white',
                border: '1.5px solid var(--paper-3)',
                borderRadius: 12,
                padding: 10,
                fontSize: 11,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)',
                color: 'var(--ink-soft)',
                margin: 0,
              }}
            >
              {snapshot}
            </pre>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <StickerButton variant="ghost" size="sm" onClick={onClose}>
              取消 <span className="tag-en">Cancel</span>
            </StickerButton>
            <a
              className="btn-sticker sm dark"
              href={issueUrl}
              target="_blank"
              rel="noreferrer"
              data-testid="bug-report-open-issue"
            >
              在 GitHub 開 Issue ↗
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
