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

type SetupFn<G extends any = any,
  PluginAPIs extends Record<string, unknown> = Record<string, unknown>,
  SetupData extends any = any> = (
    context: PluginAPIs & DefaultPluginAPIs & { ctx: Ctx; },
    setupData?: SetupData
  ) => G;

const getUuid = (randomFn: () => number = Math.random ) => {
  return randomFn().toString(32).slice(2);
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
  const projectCards = rawProjectCards.map(rawProjectCard => ({ id: getUuid(random.Number), ...rawProjectCard }) as unknown as ProjectCard);
  random.Shuffle(projectCards);
  DeckMutator.initialize(G.decks.projects, projectCards);

  const jobCards = rawJobCards.map(rawJobCard => ({ id: getUuid(random.Number), ...rawJobCard }) as unknown as JobCard);
  random.Shuffle(jobCards);
  DeckMutator.initialize(G.decks.jobs, jobCards);

  const eventCards = rawEventCards.map(rawEventCard => ({ id: getUuid(random.Number), ...rawEventCard }) as unknown as EventCard);
  // find end game event card
  // pick N random event cards based on rule and shuffle them
  // add end game event card to the end
  const endGameEvent = eventCards.find(card => card.function_name === 'end_game_after_this_round');
  if (!endGameEvent) {
    throw new Error('end_game_after_this_round event card not found');
  }
  const restEventCards = eventCards.filter(card => card.function_name !== 'end_game_after_this_round');
  const nonEndGameEventCardCount = RuleSelector.getNonEndGameNumberOfEventCards(G.rules);
  const eventCardsWithoutEndGame = reservoirSampling(restEventCards, nonEndGameEventCardCount, random.Number);
  random.Shuffle(eventCardsWithoutEndGame);
  eventCardsWithoutEndGame.push(endGameEvent);
  // initialize event deck
  DeckMutator.initialize(G.decks.events, eventCardsWithoutEndGame);

  console.log('setup table')
  // setup job slots
  const maxJobCards = RuleSelector.getTableMaxJobSlots(G.rules);
  const jobCardsInPlay = DeckSelector.peek(G.decks.jobs, maxJobCards);
  DeckMutator.draw(G.decks.jobs, maxJobCards);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCardsInPlay);

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
