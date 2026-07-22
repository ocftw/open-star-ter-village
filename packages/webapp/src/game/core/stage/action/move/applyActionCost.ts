import { PlayerID } from 'boardgame.io';
import { GameState } from '@/game/store/store';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { PlayersMutator } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { ActionExecutionOptions } from '@/game/core/stage/action/validate';
import { ActionMoveName } from './type';

/**
 * Charge the action's AP and resolve its slot for every regular move.
 * Normal execution occupies the free slot; 加班 Overtime execution redeems the
 * player's token against an already-occupied slot (which stays occupied) and
 * charges only the action's own AP. Callers must have validated first — the
 * validators reject a `useOvertime` request unless the slot is occupied.
 */
export const applyActionCost = (
  G: GameState,
  playerID: PlayerID,
  actionName: ActionMoveName,
  options?: ActionExecutionOptions,
): void => {
  const cost = RuleSelector.getActionTokenCost(G.rules, actionName);
  PlayersMutator.useActionTokens(G.players, playerID, cost);

  const slot = G.table.actionSlots[actionName];
  if (options?.useOvertime) {
    PlayersMutator.useOvertimeToken(G.players, playerID);
  } else {
    ActionSlotMutator.occupy(slot);
  }
};
