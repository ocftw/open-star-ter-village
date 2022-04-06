import { Game, PlayerID, State } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { Deck, newCardDeck } from './deck';
import { HandCards } from './handCards';
import { OpenStarTerVillageType as type } from './types';
import projectCards from './data/card/projects.json';
import resourceCards from './data/card/resources.json';
import eventCards from './data/card/events.json';
import goalCards from './data/card/goals.json';
import { isInRange, zip } from './utils';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type WithGameState<G extends any, F extends (...args: any) => void> = (G: State<G>['G'], ctx: State<G>['ctx'], ...args: Parameters<F>) => any;

export const OpenStarTerVillage: Game<type.State.Root> = {
  setup: (ctx) => {
    const rules: type.State.Root['rules'] = {};

    const players: type.State.Root['players'] = ctx.playOrder
      .reduce((s: Record<PlayerID, type.State.Player>, playerId) => {
        s[playerId] = {
          hand: { projects: [], resources: [] },
          token: { workers: 0, actions: 0 },
          completed: { projects: [] },
        };
        return s;
      }, {});

    const decks: type.State.Root['decks'] = {
      projects: newCardDeck<type.Card.Project>(projectCards),
      resources: newCardDeck<type.Card.Resource>(resourceCards),
      events: newCardDeck<type.Card.Event>(eventCards),
      goals: newCardDeck<type.Card.Goal>(goalCards),
    };

    const table: type.State.Root['table'] = {
      activeEvent: null,
      activeProjects: [],
    };

    return {
      rules,
      decks,
      table,
      players,
    };
  },
  moves: {

  },
  phases: {
    play: {
      start: true,
      onBegin: (state, ctx) => {
        // shuffle cards
        const shuffler = ctx.random!.Shuffle;
        Deck.ShuffleDrawPile(state.decks.events, shuffler);
        Deck.ShuffleDrawPile(state.decks.projects, shuffler);
        Deck.ShuffleDrawPile(state.decks.resources, shuffler);
        Deck.ShuffleDrawPile(state.decks.goals, shuffler);

        for (let playerId in state.players) {
          const projectCards = Deck.Draw(state.decks.projects, 2);
          HandCards.Add(state.players[playerId].hand.projects, projectCards);
        }

        for (let playerId in state.players) {
          const resourceCards = Deck.Draw(state.decks.resources, 5);
          HandCards.Add(state.players[playerId].hand.resources, resourceCards);
        }

        for (let playerId in state.players) {
          state.players[playerId].token.workers = 10;
          state.players[playerId].token.actions = 3;
        }
      },
    },
  },
  turn: {
    onBegin: () => {
      // roundStart do something
    },
    /**
     * send current player to action stage.
     * Do not set maxMoves as action points because following reasons
     *  1. Max moves capped all stage moves. i.e. 3 maxMoves means sum(moves in action/settle/discards/refill) <= 3
     *  2. Each move costs one and no dynamic cost can be set. i.e. createProject should cost `2` action points
     *  3. maxMoves cannot update after game starts. i.e. maxMoves cannot change when user has more than 3 action points
     * Solution: validate them in each move. return INVALID_MOVE when action points is not enough
     */
    activePlayers: {
      currentPlayer: {
        stage: 'action',
      },
    },
    stages: {
      action: {
        moves: {
          createProject: {
            // client cannot see decks, discard resource card should evaluated on server side
            client: false,
            move: ((G, ctx, projectCardIndex, resourceCardIndex) => {
              const currentPlayer = ctx.playerID!;
              const currentPlayerToken = G.players[currentPlayer].token;
              // TODO: replace hardcoded number with dynamic rules
              const createProjectActionCosts = 2;
              if (currentPlayerToken.actions < createProjectActionCosts) {
                return INVALID_MOVE;
              }
              const createProjectWorkerCosts = 1;
              if (currentPlayerToken.workers < createProjectWorkerCosts) {
                return INVALID_MOVE;
              }

              // check project card in in hand
              const currentHandProjects = G.players[currentPlayer].hand.projects
              if (!isInRange(projectCardIndex, currentHandProjects.length)) {
                return INVALID_MOVE;
              }

              // check resource card is in hand
              const currentHandResources = G.players[currentPlayer].hand.resources;
              if (!isInRange(resourceCardIndex, currentHandResources.length)) {
                return INVALID_MOVE;
              }

              // check resource card is required in project
              if (!currentHandProjects[projectCardIndex].jobs.includes(currentHandResources[resourceCardIndex].name)) {
                return INVALID_MOVE;
              }

              // reduce action tokens
              currentPlayerToken.actions -= createProjectActionCosts;
              currentPlayerToken.workers -= createProjectWorkerCosts;
              const [projectCard] = currentHandProjects.splice(projectCardIndex, 1);
              const [resourceCard] = currentHandResources.splice(resourceCardIndex, 1);

              // initial active project
              const slots: number[] = projectCard.jobs.map(p => 0);
              G.table.activeProjects.push({ card: projectCard, slots, contributions: {} });
              const activeProject = G.table.activeProjects[G.table.activeProjects.length - 1];

              // update contribution to initial contribution points
              const slotIndex = projectCard.jobs.findIndex(job => job === resourceCard.name);
              // TODO: replace with rule of inital contributions
              const contributionPoints = 1;
              activeProject.slots[slotIndex] = contributionPoints;
              const prev = activeProject.contributions[resourceCard.name] ?? 0;
              activeProject.contributions[resourceCard.name] = prev + contributionPoints;

              // discard resource card
              Deck.Discard(G.decks.resources, [resourceCard]);
            }) as WithGameState<type.State.Root, type.Move.CreateProject>,
          },
          recruit: {
            // client cannot see decks, discard resource card should evaluated on server side
            client: false,
            move: ((G, ctx, resourceCardIndex, activeProjectIndex) => {
              const currentPlayer = ctx.playerID!;
              const currentPlayerToken = G.players[currentPlayer].token;
              const recruitActionCosts = 1;
              if (currentPlayerToken.actions < recruitActionCosts) {
                return INVALID_MOVE;
              }
              const recruitWorkerCosts = 1;
              if (currentPlayerToken.workers < recruitWorkerCosts) {
                return INVALID_MOVE;
              }

              const currentPlayerResources = G.players[currentPlayer].hand.resources;
              if (!isInRange(resourceCardIndex, currentPlayerResources.length)) {
                return INVALID_MOVE;
              }

              const activeProjects = G.table.activeProjects
              if (!isInRange(activeProjectIndex, activeProjects.length)) {
                return INVALID_MOVE;
              }
              const activeProject = activeProjects[activeProjectIndex];
              const jobAndSlots = zip(activeProject.card.jobs, activeProject.slots);
              const slotIndex = jobAndSlots.findIndex(([job, slot]) =>
                job === currentPlayerResources[resourceCardIndex].name && slot === 0);
              if (slotIndex < 0) {
                return INVALID_MOVE;
              }

              // reduce action and worker tokens
              currentPlayerToken.actions -= recruitActionCosts;
              currentPlayerToken.workers -= recruitWorkerCosts;
              const [resourceCard] = currentPlayerResources.splice(resourceCardIndex, 1);

              // update contribution to recruit contribution points
              // TODO: replace with rule of recruit contributions
              const contributionPoints = 1;
              activeProject.slots[slotIndex] = contributionPoints;
              const prev = activeProject.contributions[resourceCard.name] ?? 0;
              activeProject.contributions[resourceCard.name] = prev + contributionPoints;

              // discard resource card
              Deck.Discard(G.decks.resources, [resourceCard]);
            }) as WithGameState<type.State.Root, type.Move.Recruit>,
          },
          contribute: ((G, ctx, contributions) => {
            const currentPlayer = ctx.playerID!;
            const currentPlayerToken = G.players[currentPlayer].token;
            const contributeActionCosts = 1;
            if (currentPlayerToken.actions < contributeActionCosts) {
              return INVALID_MOVE;
            }
            const activeProjects = G.table.activeProjects
            const isInvalid = contributions.map(({ activeProjectIndex, slotIndex }) => {
              if (!isInRange(activeProjectIndex, activeProjects.length)) {
                return true;
              }
              if (activeProjects[activeProjectIndex].slots[slotIndex] === 0) {
                return true;
              }
            }).some(x => x);
            if (isInvalid) {
              return INVALID_MOVE;
            }
            const totalContributions = contributions.map(({ value }) => value).reduce((a, b) => a + b, 0);
            const maxContributions = 3;
            if (!(totalContributions <= maxContributions)) {
              return INVALID_MOVE;
            }

            // deduct action tokens
            currentPlayerToken.actions -= contributeActionCosts;
            contributions.forEach(({ activeProjectIndex, slotIndex, value }) => {
              activeProjects[activeProjectIndex].slots[slotIndex] = Math.min(6, activeProjects[activeProjectIndex].slots[slotIndex] + value);
            });
          }) as WithGameState<type.State.Root, type.Move.Contribute>,
        },
        next: 'settle',
      },
      settle: {
        next: 'discard',
      },
      discard: {
        moves: {
          discardProjects: {
            noLimit: true,
            move: () => { },
          },
          discardResources: {
            noLimit: true,
            move: () => { },
          },
        },
        next: 'refill',
      },
      refill: {
        moves: {
          refillAndEnd: ((G, ctx) => {
            // refill action points
            G.players[ctx.currentPlayer].token.actions = 3;
            ctx.events?.endTurn()
          }) as WithGameState<type.State.Root, type.Move.RefillAndEnd>,
        },
      },
    },
    onEnd: () => { },
  },
  playerView: (state, ctx, playerId) => {
    const { decks, players, ...view } = state;
    const publicPlayers: Record<PlayerID, PartialBy<type.State.Player, 'hand'>> = {};
    for (let id in players) {
      if (id === playerId) {
        publicPlayers[id] = players[id];
      } else {
        // hide hand from the other players and observers
        const { hand, ...player } = players[id];
        publicPlayers[id] = player;
      }
    }

    return {
      ...view,
      players: publicPlayers,
    };
  },
};
