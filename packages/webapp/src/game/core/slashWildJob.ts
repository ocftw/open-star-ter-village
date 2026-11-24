import { PlayerID } from 'boardgame.io';
import { JobCard } from '@/game/card';
import { GameState } from '@/game/store/store';
import { Rule, RuleMutator, RuleSelector } from '@/game/store/slice/rule';
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
 * discardExcessJobCards, and excluded from every refill count. Ending the turn
 * with the card still in the market removes it and forfeits the entitlement.
 */
export const SLASH_WILD_JOB_NAME = '斜槓青年';
export const SLASH_WILD_JOB_ID_PREFIX = 'slash-';
export const SLASH_EVENT_FUNCTION_NAME = 'ignore_first_worker_requirement';
/**
 * Event text for marked games. events.json keeps the legacy wording, which in-flight
 * (unmarked) games already carry in their state; setup() swaps this in for new games.
 */
export const SLASH_WILD_EVENT_DESCRIPTION =
  `本輪每位玩家在自己的回合，人力市場會多出一張「${SLASH_WILD_JOB_NAME}」人力卡，發起專案或招募人力時可當作專案需要的任一職業使用（每位玩家限用一次，未使用則回合結束時移除）`;

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
 * Rule-level eligibility for the player's own synthetic card. Use
 * isLiveSlashWildJobCard when checking turn and round as well.
 */
export const canPlaySlashWildJobCard = (rules: Rule, playerID: PlayerID, jobCard: JobCard): boolean =>
  RuleSelector.isSlashWildJobCardEnabled(rules) &&
  isSlashWildJobCard(jobCard) &&
  getSlashWildJobCardOwner(jobCard) === playerID &&
  RuleSelector.canIgnoreFirstWorkerRequirement(rules, playerID);

/** Only the current player's card for this round can be live. */
export const isLiveSlashWildJobCard = (
  G: Pick<GameState, 'rules' | 'table'>,
  currentPlayer: PlayerID,
  card: JobCard,
): boolean =>
  card.id === getSlashWildJobCardId(currentPlayer, G.table.round) &&
  canPlaySlashWildJobCard(G.rules, currentPlayer, card);

/**
 * Whether playing `jobCard` onto a project with `requirementNames` needs a
 * player-chosen assignedJobName based on the rules alone.
 *  - marked games: only for the player's own wild card, subject to its turn and round;
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
  const { currentPlayer } = ctx;
  if (G.table.jobSlots.some(isSlashWildJobCard)) {
    G.table.jobSlots = G.table.jobSlots.filter(
      (card) => !isSlashWildJobCard(card) || isLiveSlashWildJobCard(G, currentPlayer, card),
    );
  }
  if (G.table.eventSlot?.function_name !== SLASH_EVENT_FUNCTION_NAME) return;
  const card = {
    id: getSlashWildJobCardId(currentPlayer, G.table.round),
    name: SLASH_WILD_JOB_NAME,
  };
  if (isLiveSlashWildJobCard(G, currentPlayer, card) && !G.table.jobSlots.some(isSlashWildJobCard)) {
    G.table.jobSlots.unshift(card);
  }
};

/**
 * Remove every synthetic card from the market and (defensively) the job deck.
 * The current player forfeits the entitlement if their live card was unused.
 */
export const stripSlashWildJobCards = (
  G: Pick<GameState, 'rules' | 'table' | 'decks'>,
  currentPlayer: PlayerID,
): void => {
  const keep = (card: JobCard) => !isSlashWildJobCard(card);
  if (G.table.jobSlots.some(isSlashWildJobCard)) {
    if (G.table.jobSlots.some((card) => isLiveSlashWildJobCard(G, currentPlayer, card))) {
      RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, currentPlayer);
    }
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
