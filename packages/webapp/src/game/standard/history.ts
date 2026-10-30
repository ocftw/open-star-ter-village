import type { GameState } from '../store/store';
import { ScoreBoardMutator } from '../store/slice/scoreBoard';
import type { PublicLog } from './state';

export interface PublicProjectSnapshot {
  id: string;
  name: string;
  owner: string;
  contributions: { worker: string; jobName: string; value: number }[];
}

export function publicProjects(G: GameState): PublicProjectSnapshot[] {
  return G.table.projectBoard.filter(slot => slot.card).map(slot => ({
    id: slot.card!.id, name: slot.card!.name, owner: slot.owner,
    contributions: slot.contributions.map(cube => ({ worker: cube.worker, jobName: cube.jobName, value: cube.value })),
  }));
}

export function recordHistory(G: GameState, entry: Omit<PublicLog, 'round' | 'sequence'>) {
  if (!G.standard) return;
  G.standard.log.push({ ...entry, round: G.standard.round, sequence: G.standard.log.length + 1 });
}

/** Also redact old serialized records written before public logging was fixed. */
export function publicHistory(entries: PublicLog[]): PublicLog[] {
  return entries.map(entry => entry.kind === 'discard' ? { ...entry, target: undefined } : entry);
}

export function scoreWithHistory(G: GameState, playerId: string, amount: number, reason: string, project?: PublicProjectSnapshot) {
  ScoreBoardMutator.add(G.table.scoreBoard, playerId, amount);
  if (amount) recordHistory(G, { kind: 'score', playerId, target: reason, scoreDelta: amount, ...(project ? { projects: [project] } : {}) });
}
