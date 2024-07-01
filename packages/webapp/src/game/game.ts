import { Game, MoveFn, PlayerID } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import projectCards from './data/card/projects.json';
import jobCards from './data/card/jobs.json';
import forceCards from './data/card/forces.json';
import eventCards from './data/card/events.json';
import { recruit } from './moves/recruit';
import { contributeOwnedProjects } from './moves/contributeOwnedProjects';
import { removeAndRefillJobs } from './moves/removeAndRefillJobs';
import { contributeJoinedProjects } from './moves/contributeJoinedProjects';
import { mirror } from './moves/mirror';
import { createProject } from './moves/createProject';
import { ProjectCard } from './card';
import { Player, PlayersMutator } from './store/slice/players';
import GameStore, { GameState } from './store/store';
import { DeckMutator, DeckSelector } from './store/slice/deck';
import { ProjectBoardMutator, ProjectBoardSelector } from './store/slice/projectBoard';
import { selectors } from './store/slice/projectSlot/projectSlot.selectors';
import { CardsMutator } from './store/slice/cards';
import { ActionSlotsMutator } from './store/slice/actionSlots';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const OpenStarTerVillage: Game<GameState> = {
  setup: ({ ctx }) => {
    const G = GameStore.initialState();

    DeckMutator.initialize(G.decks.projects, projectCards as unknown as ProjectCard[]);
    DeckMutator.initialize(G.decks.jobs, jobCards);
    DeckMutator.initialize(G.decks.forces, forceCards);
    DeckMutator.initialize(G.decks.events, eventCards);

    PlayersMutator.initialize(G.players, ctx.playOrder);

    return G;
  },
  moves: {

  },
  phases: {
    play: {
      start: true,
      onBegin: ({ random, G }) => {
        // shuffle cards
        const shuffler = random.Shuffle;
        DeckMutator.shuffleDrawPile(G.decks.events, shuffler);

        DeckMutator.shuffleDrawPile(G.decks.projects, shuffler);
        const maxProjectCards = 2;
        for (let playerId in G.players) {
          const projectCards = DeckSelector.peek(G.decks.projects, maxProjectCards);
          DeckMutator.draw(G.decks.projects, maxProjectCards);
          CardsMutator.add(G.players[playerId].hand.projects, projectCards);
        }

        const isForceCardsEnabled = false;
        if (isForceCardsEnabled) {
          DeckMutator.shuffleDrawPile(G.decks.forces, shuffler);
          const maxForceCards = 2;
          for (let playerId in G.players) {
            const forceCards = DeckSelector.peek(G.decks.forces, maxForceCards);
            DeckMutator.draw(G.decks.forces, maxForceCards);
            CardsMutator.add(G.players[playerId].hand.forces, forceCards);
          }
        }

        DeckMutator.shuffleDrawPile(G.decks.jobs, shuffler);
        const maxJobCards = 5;
        const jobCards = DeckSelector.peek(G.decks.jobs, maxJobCards);
        DeckMutator.draw(G.decks.jobs, maxJobCards);
        CardsMutator.add(G.table.jobSlots, jobCards);

        for (let playerId in G.players) {
          G.players[playerId].token.workers = 10;
          G.players[playerId].token.actions = 3;
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
            client: false,
            move: createProject,
          },
          recruit: {
            // client cannot see decks, discard job card should evaluated on server side
            client: false,
            move: recruit,
          },
          contributeOwnedProjects: {
            client: false,
            move: contributeOwnedProjects,
          },
          contributeJoinedProjects: {
            client: false,
            move: contributeJoinedProjects,
          },
          removeAndRefillJobs: {
            client: false,
            move: removeAndRefillJobs,
          },
          mirror: {
            client: false,
            move: mirror,
          },
        },
        next: 'settle',
      },
      settle: {
        moves: {
          settle: {
            client: false,
            // client trigger settle project and move on to next stage
            move: (({ G }) => {
              const activeProjects = G.table.projectBoard;
              const fulfilledProjects = ProjectBoardSelector.filterFulfilled(activeProjects);
              if (fulfilledProjects.length === 0) {
                return;
              }
              fulfilledProjects.forEach(project => {
                // Update Score
                Object.keys(G.players).forEach(playerId => {
                  const victoryPoints = selectors.getPlayerContribution(project, playerId);
                  G.players[playerId].victoryPoints += victoryPoints;
                });
                // Return Tokens
                Object.keys(G.players).forEach(playerId => {
                  const workerTokens = selectors.getPlayerWorkerTokens(project, playerId);
                  G.players[playerId].token.workers += workerTokens;
                });
              });
              // Update OpenSourceTree
              // Remove from table
              ProjectBoardMutator.remove(activeProjects, fulfilledProjects);
              // Discard Project Card
              const projectCards = fulfilledProjects.map(project => project.card);
              DeckMutator.discard(G.decks.projects, projectCards);
            }),
          },
        },
        next: 'discard',
      },
      discard: {
        moves: {
          discardProjects: {
            noLimit: true,
            move: () => { },
          },
          discardForces: () => {
            const isForceCardsEnabled = false;
            if (!isForceCardsEnabled) {
              return INVALID_MOVE;
            }
          },
        },
        next: 'refill',
      },
      refill: {
        moves: {
          refillAndEnd: {
            client: false,
            move: (context) => {
              const refillProject: MoveFn<GameState> = (({G, ctx}) => {
                const maxProjectCards = 2;
                const refillCardNumber = maxProjectCards - G.players[ctx.currentPlayer].hand.projects.length;
                const projectCards = DeckSelector.peek(G.decks.projects, refillCardNumber);
                DeckMutator.draw(G.decks.projects, refillCardNumber);
                CardsMutator.add(G.players[ctx.currentPlayer].hand.projects, projectCards);
              });

              const refillForce: MoveFn<GameState> = (({G, ctx}) => {
                const maxForceCards = 2;
                const refillCardNumber = maxForceCards - G.players[ctx.currentPlayer].hand.forces.length;
                const forceCards = DeckSelector.peek(G.decks.forces, refillCardNumber);
                DeckMutator.draw(G.decks.forces, refillCardNumber);
                CardsMutator.add(G.players[ctx.currentPlayer].hand.forces, forceCards);
              });

              // refill cards
              refillProject(context);
              const isForceCardsEnabled = false;
              if (isForceCardsEnabled) {
                refillForce(context);
              }

              const { G, ctx, events} = context;
              // refill action points
              G.players[ctx.currentPlayer].token.actions = 3;

              // reset active moves
              ActionSlotsMutator.reset(G.table.actionSlots);
              events.endTurn()
            },
          }
        },
      },
    },
    onEnd: () => { },
  },
  playerView: ({ G, ctx, playerID}) => {
    const { decks, players, ...view } = G;
    const publicPlayers: Record<PlayerID, PartialBy<Player, 'hand'>> = {};
    for (let id in players) {
      if (id === playerID) {
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
