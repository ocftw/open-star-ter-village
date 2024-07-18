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
import { RuleSelector } from '../store/slice/rule';
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

export const setup: SetupFn<GameState> = ({ ctx, random }) => {
  console.log('setup game')

  console.log('init state')
  // get default game state
  const G = GameStore.initialState();

  // TODO: initialize rule by difficulty and number of players
  // RuleMutator.setupNumPlayers(G.rules, ctx.numPlayers);

  console.log('setup decks')
  // add cards to decks
  console.log('setup project cards')
  const mapToProjectCards = (rawProjectCards: RawProjectCard[]): ProjectCard[] => {
    return rawProjectCards.map(rawProjectCard => ({
      id: getUuid(random.Number),
      ...rawProjectCard,
    }));
  };

  const projectCards = mapToProjectCards(rawProjectCards as unknown as RawProjectCard[]);
  const shuffledProjectCards = random.Shuffle(projectCards);
  DeckMutator.initialize(G.decks.projects, shuffledProjectCards);

  console.log('setup job cards')
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

  console.log('setup event cards');
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
  const eventCardsWithoutEndGame = reservoirSampling(basicEventCards, nonEndGameEventCardCount, random.Number);
  const shuffledEventCards = random.Shuffle(eventCardsWithoutEndGame);
  shuffledEventCards.push(endGameEventCard);
  // initialize event deck
  DeckMutator.initialize(G.decks.events, shuffledEventCards);

  console.log('setup table')
  // setup job slots
  const maxJobCards = RuleSelector.getTableMaxJobSlots(G.rules);
  const jobCardsInPlay = DeckSelector.peek(G.decks.jobs, maxJobCards);
  DeckMutator.draw(G.decks.jobs, maxJobCards);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCardsInPlay);
  // setup project slots
  const maxProjectSlots = RuleSelector.getTableMaxProjectSlots(G.rules);
  ProjectBoardMutator.initialize(G.table.projectBoard, maxProjectSlots);

  console.log('setup players')
  // initialize players and score board
  PlayersMutator.initialize(G.players, ctx.playOrder);
  ScoreBoardMutator.initialize(G.table.scoreBoard, ctx.playOrder);

  console.log('setup player hands')
  // setup player hands
  const maxProjectCards = RuleSelector.getPlayerMaxProjectCards(G.rules);
  ctx.playOrder.forEach(playerId => {
    const projectCards = DeckSelector.peek(G.decks.projects, maxProjectCards);
    DeckMutator.draw(G.decks.projects, maxProjectCards);
    PlayersMutator.addProjects(G.players, playerId, projectCards);
  });

  console.log('setup player tokens')
  // setup player tokens
  const numWorkerTokens = RuleSelector.getPlayerMaxWorkerTokens(G.rules);
  const numActionTokens = RuleSelector.getPlayerMaxActionTokens(G.rules);
  ctx.playOrder.forEach(playerId => {
    PlayersMutator.resetWorkerTokens(G.players, playerId, numWorkerTokens);
    PlayersMutator.resetActionTokens(G.players, playerId, numActionTokens);
  });

  console.log('end setup game')
  return G;
};
