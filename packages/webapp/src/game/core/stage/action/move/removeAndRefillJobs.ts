import { INVALID_MOVE } from 'boardgame.io/core';
import { isInRange } from '@/game/utils';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { GameMove } from '@/game/core/type';
import { CardsMutator } from '@/game/store/slice/cards';
import { ActionSlotMutator, ActionSlotSelector } from '@/game/store/slice/actionSlot';
import { PlayersMutator, PlayersSelector } from '@/game/store/slice/players';
import { RuleSelector } from '@/game/store/slice/rule';
import { ScoreBoardMutator } from '@/game/store/slice/scoreBoard';

export type RemoveAndRefillJobs = (jobCardIndices: number[]) => void;
export const removeAndRefillJobs: GameMove<RemoveAndRefillJobs> = ({ G, playerID, events }, jobCardIndices) => {
  if (!RuleSelector.isActionSlotAvailable(G.rules, 'removeAndRefillJobs')) {
    return INVALID_MOVE;
  }
  if (!ActionSlotSelector.isAvailable(G.table.actionSlots.removeAndRefillJobs)) {
    return INVALID_MOVE;
  }

  console.log('use action tokens')
  const actionTokenCosts = RuleSelector.getActionTokenCost(G.rules, 'removeAndRefillJobs');
  PlayersMutator.useActionTokens(G.players, playerID, actionTokenCosts);
  if (PlayersSelector.getNumActionTokens(G.players, playerID) < 0) {
    return INVALID_MOVE;
  }
  ActionSlotMutator.occupy(G.table.actionSlots.removeAndRefillJobs);

  const currentJob = G.table.jobSlots;
  const jobDeck = G.decks.jobs;
  const isInvalid = jobCardIndices.map(index => !isInRange(index, currentJob.length)).some(x => x);
  if (isInvalid) {
    return INVALID_MOVE;
  }
  const removedJobCards = jobCardIndices.map(index => currentJob[index]);
  CardsMutator.remove(currentJob, removedJobCards);
  DeckMutator.discard(jobDeck, removedJobCards);

  const maxJobCards = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = maxJobCards - currentJob.length;
  const jobCards = DeckSelector.peek(jobDeck, refillCardNumber);
  DeckMutator.draw(jobDeck, refillCardNumber);
  CardsMutator.add(currentJob, jobCards);

  console.log('score victory points')
  const victoryPoints = RuleSelector.getActionVictoryPoints(G.rules, 'removeAndRefillJobs');
  ScoreBoardMutator.add(G.table.scoreBoard, playerID, victoryPoints);

  // end stage if no action tokens left
  if (PlayersSelector.getNumActionTokens(G.players, playerID) === 0) {
    events.endStage();
    return;
  }
};
