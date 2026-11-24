import type { LogEntry } from 'boardgame.io';
import type { ClientGameState as GameState } from '@/game/store/store';
import { getRealJobCards, isLiveSlashWildJobCard } from '@/game/core/slashWildJob';
import { ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersSelector } from '@/game/store/slice/players';

/** Timings (ms) of the accepted-refill sequence. Reduced motion skips all of them. */
export const REFILL_TIMING = {
  /** Wait for the server to accept before the client gives up and restores the originals. */
  reject: 2500,
  /** Ghosts have cleared to empty slots; hold before the survivors slide. */
  empty: 240,
  /** Survivors slide left to close every gap. */
  shift: 300,
  /** One incoming card flying from the deal origin to the rightmost slot (60ms delay + 420ms flight + slack). */
  deal: 520,
  /** Stagger inside a deal step before the flight starts. */
  dealDelay: 60,
  popup: 2000,
} as const;

export type RefillCard = { id: string; name: string };

/** Everything captured when 確認人力 dispatches the move; survives resetAction. */
export type RefillPending = {
  removedIds: string[];
  /** The table as the player saw it (old identities, old order). */
  tiles: RefillCard[];
  apBefore: number;
  playerID: string;
  currentPlayer: string;
  turn: number;
};

export type RefillPhase = 'idle' | 'awaiting' | 'emptying' | 'shifting' | 'dealing';

export type RefillTile =
  | { kind: 'card'; id: string; name: string; ghost?: boolean; motion?: 'deal'; delay?: number }
  | { kind: 'empty'; key: string };

export type RefillView = { phase: Exclude<RefillPhase, 'idle'>; tiles: RefillTile[]; count: number };

export type RefillSequence = { survivors: RefillCard[]; incoming: RefillCard[]; dealt: number };

export function isRefillAccepted(
  pending: RefillPending,
  { G, playerID, turn, log }: { G: GameState; playerID: string | null; turn: number; log: readonly LogEntry[] },
): boolean {
  if (playerID !== pending.playerID) return false;
  if (turn !== pending.turn) {
    // Turn end restores AP and frees the slot. The log still records the move on its original turn.
    return turn === pending.turn + 1 && log.some((entry) => {
      if (entry.turn !== pending.turn || entry.action.type !== 'MAKE_MOVE') return false;
      const { type, playerID: actor, args } = entry.action.payload;
      const ids = args?.[0];
      return type === 'removeAndRefillJobs' && actor === playerID && Array.isArray(ids) &&
        ids.length === pending.removedIds.length && pending.removedIds.every((id, index) => id === ids[index]);
    });
  }

  const originals = new Set(getRealJobCards(pending.tiles).map((card) => card.id));
  const onTable = new Set(G.table.jobSlots.map((card) => card.id));
  if (!pending.removedIds.length || pending.removedIds.some((id) => !originals.has(id) || onTable.has(id))) return false;
  if (PlayersSelector.getNumActionTokens(G.players, playerID) >= pending.apBefore) return false;
  return ActionSlotSelector.isOccupied(G.table.actionSlots.removeAndRefillJobs);
}

/** Freeze the real-card queue at acceptance, keeping survivors in table order. */
export function splitAccepted(pending: RefillPending, G: GameState): Pick<RefillSequence, 'survivors' | 'incoming'> {
  const removed = new Set(pending.removedIds);
  const originals = getRealJobCards(pending.tiles);
  const seen = new Set(originals.map((card) => card.id));
  return {
    survivors: originals.filter((card) => !removed.has(card.id)),
    incoming: getRealJobCards(G.table.jobSlots).filter((card) => !seen.has(card.id)),
  };
}

const empties = (count: number, from = 0): RefillTile[] =>
  Array.from({ length: Math.max(0, count) }, (_, i) => ({ kind: 'empty', key: `empty-${from + i}` }));

const card = (c: RefillCard, extra: Partial<Extract<RefillTile, { kind: 'card' }>> = {}): RefillTile => ({
  kind: 'card', id: c.id, name: c.name, ...extra,
});

/**
 * The market row for each phase. Incoming faces exist only from `dealing`
 * onwards, and each enters after the last card already on the table.
 */
export function buildRefillView(
  phase: Exclude<RefillPhase, 'idle'>,
  pending: RefillPending,
  sequence: RefillSequence | null,
  G: GameState,
  playerID: string | null,
  currentPlayer: string,
): RefillView {
  const removed = new Set(pending.removedIds);
  const realTiles = getRealJobCards(pending.tiles);
  const wild = playerID === currentPlayer
    ? G.table.jobSlots.find((job) => isLiveSlashWildJobCard(G, currentPlayer, job))
    : undefined;
  const total = realTiles.length;
  let tiles: RefillTile[];
  if (phase === 'awaiting' || !sequence) {
    tiles = realTiles.map((c) => card(c, removed.has(c.id) ? { ghost: true } : {}));
  } else if (phase === 'emptying') {
    tiles = realTiles.map((c, i) => (removed.has(c.id) ? { kind: 'empty', key: `empty-${i}` } : card(c)));
  } else if (phase === 'shifting') {
    tiles = [...sequence.survivors.map((c) => card(c)), ...empties(total - sequence.survivors.length)];
  } else {
    const seated = sequence.incoming.slice(0, sequence.dealt);
    const flying = sequence.incoming[sequence.dealt];
    const shown = [
      ...sequence.survivors.map((c) => card(c)),
      ...seated.map((c) => card(c)),
      ...(flying ? [card(flying, { motion: 'deal' as const, delay: REFILL_TIMING.dealDelay })] : []),
    ];
    tiles = [...shown, ...empties(total - shown.length)];
  }
  return { phase, tiles: wild ? [card(wild), ...tiles] : tiles, count: total };
}
