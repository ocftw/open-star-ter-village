import { PlayerID } from 'boardgame.io';
import { JobCard } from '@/game/card';
import { GameState } from '@/game/store/store';
import { Rule, RuleSelector } from '@/game/store/slice/rule';
import { JobSlots } from '@/game/store/slice/jobSlots';
import { DeckMutator, DeckSelector } from '@/game/store/slice/deck';
import { GameHookHandler } from './type';

/**
 * 斜槓青年 per-turn wild job card (games marked with Rule.slashWildJobCard).
 *
 * While the 斜槓青年 event is active, the entitled current player's market gets
 * ONE synthetic job card prepended at turn begin. Only that card is wild: it may
 * fill any profession the target project requires (the move names it through
 * assignedJobName). It is engine-made and never part of the job deck: it is
 * removed (not discarded) when played, rejected by removeAndRefillJobs /
 * discardExcessJobCards, stripped at turn end, and excluded from every refill count.
 */
export const SLASH_WILD_JOB_NAME = '斜槓青年';
export const SLASH_WILD_JOB_ID_PREFIX = 'slash-';
export const SLASH_EVENT_FUNCTION_NAME = 'ignore_first_worker_requirement';

/** Real job card ids are base-32 strings without '-', so the prefix cannot collide. */
export const isSlashWildJobCard = (card: Pick<JobCard, 'id' | 'name'>): boolean =>
  card.id.startsWith(SLASH_WILD_JOB_ID_PREFIX) || card.name === SLASH_WILD_JOB_NAME;

export const getSlashWildJobCardId = (playerID: PlayerID, round: number): string =>
  `${SLASH_WILD_JOB_ID_PREFIX}${playerID}-${round}`;

/** The player a synthetic card was dealt to (`slash-<playerID>-<round>`). */
export const getSlashWildJobCardOwner = (card: Pick<JobCard, 'id'>): PlayerID | undefined => {
  if (!card.id.startsWith(SLASH_WILD_JOB_ID_PREFIX)) return undefined;
  const rest = card.id.slice(SLASH_WILD_JOB_ID_PREFIX.length);
  const dash = rest.lastIndexOf('-');
  return dash > 0 ? rest.slice(0, dash) : undefined;
};

/** Market cards that came from the job deck (the synthetic wild card excluded). */
export const getRealJobCards = (jobSlots: JobSlots): JobCard[] =>
  jobSlots.filter((card) => !isSlashWildJobCard(card));

export const getNumRealJobSlots = (jobSlots: JobSlots): number => getRealJobCards(jobSlots).length;

/**
 * Whether `jobCard` may be used by `playerID` as a wild card right now:
 * marked game, the player's own synthetic card, entitlement unspent.
 */
export const canPlaySlashWildJobCard = (rules: Rule, playerID: PlayerID, jobCard: JobCard): boolean =>
  RuleSelector.isSlashWildJobCardEnabled(rules) &&
  isSlashWildJobCard(jobCard) &&
  getSlashWildJobCardOwner(jobCard) === playerID &&
  RuleSelector.canIgnoreFirstWorkerRequirement(rules, playerID);

/**
 * Whether playing `jobCard` onto a project with `requirementNames` needs a
 * player-chosen assignedJobName. UI pickers and validators share this.
 *  - marked games: only for the wild card;
 *  - legacy games: a mismatched ordinary card while the entitlement is unspent.
 */
export const requiresAssignedJobName = (
  rules: Rule,
  playerID: PlayerID,
  jobCard: JobCard,
  requirementNames: string[],
): boolean => {
  if (RuleSelector.isSlashWildJobCardEnabled(rules)) {
    return canPlaySlashWildJobCard(rules, playerID, jobCard);
  }
  return (
    !requirementNames.includes(jobCard.name) &&
    RuleSelector.canIgnoreFirstWorkerRequirement(rules, playerID)
  );
};

/** Turn-begin hook: deal the entitled current player their wild card. */
export const offerSlashWildJobCard: GameHookHandler = ({ G, ctx }) => {
  if (!RuleSelector.isSlashWildJobCardEnabled(G.rules)) return;
  if (G.table.eventSlot?.function_name !== SLASH_EVENT_FUNCTION_NAME) return;
  if (!RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, ctx.currentPlayer)) return;
  if (G.table.jobSlots.some(isSlashWildJobCard)) return;
  G.table.jobSlots.unshift({
    id: getSlashWildJobCardId(ctx.currentPlayer, G.table.round),
    name: SLASH_WILD_JOB_NAME,
  });
};

/**
 * Remove every synthetic card from the market and (defensively) the job deck.
 * Runs for marked and unmarked games alike: an unmarked game never deals one,
 * so any found there is stray state and is dropped.
 */
export const stripSlashWildJobCards = (G: Pick<GameState, 'table' | 'decks'>): void => {
  const keep = (card: JobCard) => !isSlashWildJobCard(card);
  if (G.table.jobSlots.some(isSlashWildJobCard)) {
    G.table.jobSlots = G.table.jobSlots.filter(keep);
  }
  if (G.decks.jobs.drawPile.some(isSlashWildJobCard)) {
    G.decks.jobs.drawPile = G.decks.jobs.drawPile.filter(keep);
  }
  if (G.decks.jobs.discardPile.some(isSlashWildJobCard)) {
    G.decks.jobs.discardPile = G.decks.jobs.discardPile.filter(keep);
  }
};

/** Discard only real cards; the synthetic card simply disappears. */
export const discardJobCards = (G: Pick<GameState, 'decks'>, cards: JobCard[]): void => {
  DeckMutator.discard(G.decks.jobs, cards.filter((card) => !isSlashWildJobCard(card)));
};

/** Refill the market up to maxJobSlots REAL cards from the job deck. */
export const refillJobSlots = (G: Pick<GameState, 'rules' | 'table' | 'decks'>): void => {
  const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
  const refillCardNumber = Math.max(0, maxJobSlots - getNumRealJobSlots(G.table.jobSlots));
  const jobCards = DeckSelector.peek(G.decks.jobs, refillCardNumber);
  DeckMutator.draw(G.decks.jobs, refillCardNumber);
  G.table.jobSlots.push(...jobCards);
};
