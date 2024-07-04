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

type SetupFn<G extends any = any,
  PluginAPIs extends Record<string, unknown> = Record<string, unknown>,
  SetupData extends any = any> = (
    context: PluginAPIs & DefaultPluginAPIs & { ctx: Ctx; },
    setupData?: SetupData
  ) => G;

export const setup: SetupFn<GameState> = ({ ctx, random }) => {
  const shuffler = random.Shuffle;

  console.log('setup setup setup')

  // get default game state
  const G = GameStore.initialState();

  DeckMutator.initialize(G.decks.projects, projectCards as unknown as ProjectCard[]);
  DeckMutator.initialize(G.decks.jobs, jobCards);
  DeckMutator.initialize(G.decks.events, eventCards);

  PlayersMutator.initialize(G.players, ctx.playOrder);
  ScoreBoardMutator.initialize(G.table.scoreBoard, ctx.playOrder);

  // shuffle cards
  DeckMutator.shuffleDrawPile(G.decks.events, shuffler);

  DeckMutator.shuffleDrawPile(G.decks.projects, shuffler);

  const maxProjectCards = 2;
  ctx.playOrder.forEach(playerId => {
    const projectCards = DeckSelector.peek(G.decks.projects, maxProjectCards);
    DeckMutator.draw(G.decks.projects, maxProjectCards);
    PlayersMutator.addProjects(G.players, playerId, projectCards);
  });

  DeckMutator.shuffleDrawPile(G.decks.jobs, shuffler);
  const maxJobCards = 6;
  const jobCardsInPlay = DeckSelector.peek(G.decks.jobs, maxJobCards);
  DeckMutator.draw(G.decks.jobs, maxJobCards);
  JobSlotsMutator.addJobCards(G.table.jobSlots, jobCardsInPlay);

  const numWorkerTokens = 12;
  const numActionTokens = 4;
  ctx.playOrder.forEach(playerId => {
    PlayersMutator.resetWorkerTokens(G.players, playerId, numWorkerTokens);
    PlayersMutator.resetActionTokens(G.players, playerId, numActionTokens);
  });

  return G;
};
