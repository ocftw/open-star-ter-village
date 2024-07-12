import { Ctx, DefaultPluginAPIs } from 'boardgame.io';
import projectCards from '../data/card/projects.json';
import jobCards from '../data/card/jobs.json';
import eventCards from '../data/card/events.json';
import { ProjectCard } from '../card';
import { PlayersMutator } from '../store/slice/players';
import GameStore, { GameState } from '../store/store';
import { DeckMutator, DeckSelector } from '../store/slice/deck';
import { ScoreBoardMutator } from "../store/slice/scoreBoard";
import { JobSlotsMutator } from '../store/slice/jobSlots';
import { RuleSelector } from '../store/slice/rule';

type SetupFn<G extends any = any,
  PluginAPIs extends Record<string, unknown> = Record<string, unknown>,
  SetupData extends any = any> = (
    context: PluginAPIs & DefaultPluginAPIs & { ctx: Ctx; },
    setupData?: SetupData
  ) => G;

export const setup: SetupFn<GameState> = ({ ctx, random }) => {
  console.log('setup game')

  const shuffler = random.Shuffle;

  console.log('init state')
  // get default game state
  const G = GameStore.initialState();

  // TODO: initialize rules

  console.log('setup decks')
  // add cards to decks
  DeckMutator.initialize(G.decks.projects, projectCards as unknown as ProjectCard[]);
  DeckMutator.initialize(G.decks.jobs, jobCards);
  DeckMutator.initialize(G.decks.events, eventCards);

  console.log('shuffle decks')
  // shuffle decks
  DeckMutator.shuffleDrawPile(G.decks.projects, shuffler);
  DeckMutator.shuffleDrawPile(G.decks.events, shuffler);
  DeckMutator.shuffleDrawPile(G.decks.jobs, shuffler);

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
