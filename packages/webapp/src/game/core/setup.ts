import { Ctx, DefaultPluginAPIs } from 'boardgame.io';
import rawProjectCards from '../data/card/projects.json';
import rawJobCards from '../data/card/jobs.json';
import rawEventCards from '../data/card/events.json';
import { EventCard, JobCard, ProjectCard } from '../card';
import { PlayersMutator } from '../store/slice/players';
import GameStore, { GameState } from '../store/store';
import { DeckMutator, DeckSelector } from '../store/slice/deck';
import { ScoreBoardMutator } from "../store/slice/scoreBoard";
import { JobSlotsMutator } from '../store/slice/jobSlots';
import { RuleMutator, RuleSelector } from '../store/slice/rule';
import { reservoirSampling } from '../utils';
import { ProjectBoardMutator } from '../store/slice/projectBoard';

type SetupFn<G extends any = any,
  PluginAPIs extends Record<string, unknown> = Record<string, unknown>,
  SetupData extends any = any> = (
    context: PluginAPIs & DefaultPluginAPIs & { ctx: Ctx; },
    setupData?: SetupData
  ) => G;

const getUuid = (randomFn: () => number = Math.random ) => {
  return randomFn().toString(32).slice(2);
}

interface RawProjectCard {
  name: string;
  type: string;
  difficulty: number;
  description: string;
  requirements: Record<string, number>;
}

interface RawJobCard {
  name: string;
  number_of_cards: number;
}

export interface GameSetupData {
  /** Forces a specific event card to appear first in the event deck (for demos/tests). */
  forcedFirstEvent?: string;
}

export const setup: SetupFn<GameState> = ({ ctx, random }, setupData?: GameSetupData) => {
  // get default game state
  const G = GameStore.initialState();

  // Set event card count based on player count (Simplified Mode rulebook):
  // 2 players → 6 cards, 3 players → 5 cards, 4+ players → 4 cards
  RuleMutator.setNumNonEndGameEventCards(G.rules, ctx.numPlayers);

  // add cards to decks
  const mapToProjectCards = (rawProjectCards: RawProjectCard[]): ProjectCard[] => {
    return rawProjectCards.map(rawProjectCard => ({
      id: getUuid(random.Number),
      ...rawProjectCard,
    }));
  };

  const projectCards = mapToProjectCards(rawProjectCards as unknown as RawProjectCard[]);
  const shuffledProjectCards = random.Shuffle(projectCards);
  DeckMutator.initialize(G.decks.projects, shuffledProjectCards);

  const mapToJobCards = (rawJobCards: RawJobCard[]): JobCard[] => {
    const jobCards: JobCard[] = [];
    rawJobCards.forEach(rawJobCard => {
      const jobCardCreator = () => ({
        id: getUuid(random.Number),
        name: rawJobCard.name,
      });
      for (let i = 0; i < rawJobCard.number_of_cards; i++) {
        jobCards.push(jobCardCreator());
      }
    })
    return jobCards;
  };

  const jobCards = mapToJobCards(rawJobCards);
  const shuffledJobCards = random.Shuffle(jobCards);
  DeckMutator.initialize(G.decks.jobs, shuffledJobCards);

  // TODO: Validate event card function names
  const eventCards = rawEventCards.map(rawEventCard => ({ id: getUuid(random.Number), ...rawEventCard }) as unknown as EventCard);
  // find end game event card
  // pick N random event cards based on rule and shuffle them
  // add end game event card to the end
  const lastRoundEventCards = eventCards.filter(card => card.type === 'last_round');
  if (lastRoundEventCards.length === 0) {
    throw new Error('last round event card not found');
  }
  if (lastRoundEventCards.length > 1) {
    throw new Error('multiple last round event cards found');
  }
  const endGameEventCard = lastRoundEventCards[0];

  const basicEventCards = eventCards.filter(card => card.type === 'basic');
  const nonEndGameEventCardCount = RuleSelector.getNonEndGameNumberOfEventCards(G.rules);

  // Support a demo/test mode: when the URL contains ?demo=four-freedoms, force
  // 四大自由 as the first event card so screenshots can be captured deterministically.
  // This is only active in development (Local transport runs in the browser).
  const _window = (globalThis as { window?: { location: { search: string } } }).window;
  const demoParam = _window !== undefined
    ? new URLSearchParams(_window.location.search).get('demo')
    : null;
  const forcedFirstEvent = setupData?.forcedFirstEvent
    ?? (demoParam === 'four-freedoms' ? 'add_two_worker_slots' : undefined);

  let shuffledEventCards: EventCard[];
  if (forcedFirstEvent) {
    const forced = basicEventCards.find(c => c.function_name === forcedFirstEvent);
    const rest = forced ? basicEventCards.filter(c => c.function_name !== forcedFirstEvent) : basicEventCards;
    const count = forced ? nonEndGameEventCardCount - 1 : nonEndGameEventCardCount;
    const selected = reservoirSampling(rest, count, random.Number);
    shuffledEventCards = forced ? [forced, ...random.Shuffle(selected)] : random.Shuffle(selected);
  } else {
    const eventCardsWithoutEndGame = reservoirSampling(basicEventCards, nonEndGameEventCardCount, random.Number);
    shuffledEventCards = random.Shuffle(eventCardsWithoutEndGame);
  }
  shuffledEventCards.push(endGameEventCard);
  // initialize event deck
  DeckMutator.initialize(G.decks.events, shuffledEventCards);

  // setup job slots
  const maxJobCards = RuleSelector.getTableMaxJobSlots(G.rules);
  const jobCardsInPlay = DeckSelector.peek(G.decks.jobs, maxJobCards);
  DeckMutator.draw(G.decks.jobs, maxJobCards);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCardsInPlay);
  // setup project slots
  const maxProjectSlots = RuleSelector.getTableMaxProjectSlots(G.rules);
  ProjectBoardMutator.initialize(G.table.projectBoard, maxProjectSlots);

  // initialize players and score board
  PlayersMutator.initialize(G.players, ctx.playOrder);
  ScoreBoardMutator.initialize(G.table.scoreBoard, ctx.playOrder);

  // setup player hands
  const maxProjectCards = RuleSelector.getPlayerMaxProjectCards(G.rules);
  ctx.playOrder.forEach(playerId => {
    const projectCards = DeckSelector.peek(G.decks.projects, maxProjectCards);
    DeckMutator.draw(G.decks.projects, maxProjectCards);
    PlayersMutator.addProjects(G.players, playerId, projectCards);
  });

  // setup player tokens
  const numWorkerTokens = RuleSelector.getPlayerMaxWorkerTokens(G.rules);
  const numActionTokens = RuleSelector.getPlayerMaxActionTokens(G.rules);
  ctx.playOrder.forEach(playerId => {
    PlayersMutator.resetWorkerTokens(G.players, playerId, numWorkerTokens);
    PlayersMutator.resetActionTokens(G.players, playerId, numActionTokens);
  });

  // Initialize G.playOrder from ctx.playOrder so it can be rotated each round
  // via passStartPlayerToken without mutating the read-only ctx.
  G.playOrder = [...ctx.playOrder];

  return G;
};
