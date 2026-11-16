import type { LogEntry } from 'boardgame.io';
import type { GameContext } from '@/components/GameContextHelpers';
import { RuleSelector } from '@/game/store/slice/rule';
import { TableSelector } from '@/game/store/slice/table';

type HistorySource = Pick<GameContext, 'G' | 'ctx'> & { log?: LogEntry[] };

export interface HistoryEntry {
  id: string;
  text: string;
  playerID?: string;
}

interface ObservedDiff extends HistoryEntry {
  after: string | null;
  round: number;
}

export interface GameHistoryState {
  source: HistorySource;
  events: Record<number, string>;
  projectNames: Record<string, string>;
  roundExtras: Record<number, HistoryEntry[]>;
  diffs: ObservedDiff[];
  entries: HistoryEntry[];
}

const logKey = (entry: LogEntry) =>
  `${entry._stateID}:${entry.turn}:${entry.action.type}:${entry.action.payload.type}:${entry.action.payload.playerID ?? ''}`;

function moveEntry(source: HistorySource, entry: LogEntry, index: number, projectNames: Record<string, string>): HistoryEntry | undefined {
  if (entry.action.type !== 'MAKE_MOVE') return;
  const { type, args, playerID } = entry.action.payload;
  const id = `move:${index}:${logKey(entry)}`;
  let text: string;
  switch (type) {
    case 'createProject': {
      const cardID: unknown = Array.isArray(args) ? args[0] : undefined;
      const cards = [
        ...source.G.table.projectBoard.flatMap((slot) => slot.card ? [slot.card] : []),
        ...Object.values(source.G.players).flatMap((player) => player.hand?.projects ?? []),
      ];
      const name = (typeof cardID === 'string' ? cards.find((card) => card.id === cardID)?.name : undefined)
        ?? projectNames[id];
      if (name) projectNames[id] = name;
      text = name ? `發起專案：${name}` : '發起專案';
      break;
    }
    case 'recruit': text = '招募人力'; break;
    case 'contributeOwnedProjects':
    case 'contributeJoinedProjects': text = '貢獻專案'; break;
    case 'removeAndRefillJobs': text = '換人力'; break;
    default: return;
  }
  return { id, text, playerID: playerID ?? undefined };
}

/** Pure session reducer. Log entries rebuild each time; observations never persist in G. */
export function buildGameHistory(source: HistorySource, previous?: GameHistoryState): GameHistoryState {
  const { G, ctx } = source;
  const log = source.log ?? [];
  const round = TableSelector.getRound(G.table);
  // The queued endGame can advance ctx.turn after the final event is removed, without advancing G's round.
  const terminalAdvance = ctx.gameover !== undefined && G.table.eventSlot === null && ctx.turn % ctx.numPlayers === 1;
  const anchorTurn = terminalAdvance ? ctx.turn - 1 : ctx.turn;
  // Every player takes exactly one turn per round; G is the round authority.
  const roundOf = (entry: LogEntry) =>
    round - (Math.ceil(anchorTurn / ctx.numPlayers) - Math.ceil(entry.turn / ctx.numPlayers));
  const events = { ...previous?.events };
  const projectNames = { ...previous?.projectNames };
  if (G.table.eventSlot) events[round] = G.table.eventSlot.name;
  const roundExtras = { ...previous?.roundExtras };
  const diffs = [...(previous?.diffs ?? [])];

  // Mount/reload only establishes a baseline, even with a populated log/scoreboard.
  if (previous) {
    const last = log[log.length - 1];
    const after = last ? logKey(last) : null;
    const diffRound = last ? roundOf(last) : round;
    const appendDiff = (text: string, playerID?: string) => diffs.push({
      id: `diff:${diffs.length}`, after, round: diffRound, text, playerID,
    });
    for (const slot of previous.source.G.table.projectBoard) {
      if (slot.card && !G.table.projectBoard.some((current) => current.card?.id === slot.card!.id)) {
        appendDiff(`專案結案：${slot.card.name}`);
      }
    }
    for (const [playerID, points] of Object.entries(G.table.scoreBoard)) {
      const gain = points - (previous.source.G.table.scoreBoard[playerID] ?? points);
      if (gain > 0) appendDiff(`影響力 +${gain}`, playerID);
    }
    if (round !== TableSelector.getRound(previous.source.G.table) && G.table.eventSlot?.name === '青年補助') {
      const recipient = Object.entries(G.players).find(([, player]) =>
        player.token.actions > RuleSelector.getPlayerMaxActionTokens(G.rules));
      roundExtras[round] = [{
        id: `youth:${round}`,
        text: recipient ? '青年補助：本輪多 1 個行動點' : '青年補助：最低分不只一位，本輪無人獲得',
        playerID: recipient?.[0],
      }];
    }
  }

  const entries: HistoryEntry[] = [];
  const rounds = new Set([round, ...log.map(roundOf), ...diffs.map((diff) => diff.round),
    ...Object.keys(roundExtras).map(Number)]);
  for (const entryRound of Array.from(rounds).filter((value) => value > 0).sort((a, b) => a - b)) {
    entries.push({
      id: `round:${entryRound}`,
      text: `第 ${entryRound} 輪開始${events[entryRound] ? ` · 事件：${events[entryRound]}` : ''}`,
    });
    entries.push(...(roundExtras[entryRound] ?? []));
    const pending = diffs.filter((diff) => diff.round === entryRound);
    log.forEach((entry, index) => {
      if (roundOf(entry) !== entryRound) return;
      const move = moveEntry(source, entry, index, projectNames);
      if (move) entries.push(move);
      // Settlement's ctx.turn has already advanced; the log anchor still belongs to T.
      for (let i = 0; i < pending.length;) {
        if (pending[i].after === logKey(entry)) entries.push(...pending.splice(i, 1));
        else i++;
      }
    });
    // A reconnect can omit the anchor: keep the observation at the end of its round.
    entries.push(...pending);
  }
  return { source, events, projectNames, roundExtras, diffs, entries };
}
