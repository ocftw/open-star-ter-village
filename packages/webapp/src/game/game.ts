import { Game, MoveFn, PlayerID } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { Deck, newCardDeck } from './deck';
import { Cards } from './cards';
import projectCards from './data/card/projects.json';
import jobCards from './data/card/jobs.json';
import forceCards from './data/card/forces.json';
import eventCards from './data/card/events.json';
import { ActiveProject, ActiveProjects } from './activeProjects';
import { contributeJoinedProjects, contributeOwnedProjects, createProject, mirror, recruit, removeAndRefillJobs } from './moves/actionMoves';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const OpenStarTerVillage: Game<OpenStarTerVillageType.State.Root> = {
  setup: ({ ctx }) => {
    const rules: OpenStarTerVillageType.State.Root['rules'] = {};

    const players: OpenStarTerVillageType.State.Root['players'] = ctx.playOrder
      .reduce((s: Record<PlayerID, OpenStarTerVillageType.State.Player>, playerId) => {
        s[playerId] = {
          hand: { projects: [], forces: [] },
          token: { workers: 0, actions: 0 },
          completed: { projects: [] },
          victoryPoints: 0,
        };
        return s;
      }, {});

    const decks: OpenStarTerVillageType.State.Root['decks'] = {
      projects: newCardDeck<OpenStarTerVillageType.Card.Project>(projectCards as unknown as OpenStarTerVillageType.Card.Project[]),
      jobs: newCardDeck<OpenStarTerVillageType.Card.Job>(jobCards),
      forces: newCardDeck<OpenStarTerVillageType.Card.Force>(forceCards),
      events: newCardDeck<OpenStarTerVillageType.Card.Event>(eventCards),
    };

    const table: OpenStarTerVillageType.State.Root['table'] = {
      activeEvent: null,
      activeProjects: [],
      activeJobs: [],
      activeMoves: {
        contributeJoinedProjects: true,
        contributeOwnedProjects: true,
        createProject: true,
        recruit: true,
        removeAndRefillJobs: true,
        mirror: true,
      },
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
      onBegin: ({ random, G }) => {
        // shuffle cards
        const shuffler = random.Shuffle;
        Deck.ShuffleDrawPile(G.decks.events, shuffler);

        Deck.ShuffleDrawPile(G.decks.projects, shuffler);
        const maxProjectCards = 2;
        for (let playerId in G.players) {
          const projectCards = Deck.Draw(G.decks.projects, maxProjectCards);
          Cards.Add(G.players[playerId].hand.projects, projectCards);
        }

        const isForceCardsEnabled = false;
        if (isForceCardsEnabled) {
          Deck.ShuffleDrawPile(G.decks.forces, shuffler);
          const maxForceCards = 2;
          for (let playerId in G.players) {
            const forceCards = Deck.Draw(G.decks.forces, maxForceCards);
            Cards.Add(G.players[playerId].hand.forces, forceCards);
          }
        }

        Deck.ShuffleDrawPile(G.decks.jobs, shuffler);
        const maxJobCards = 5;
        const jobCards = Deck.Draw(G.decks.jobs, maxJobCards);
        Cards.Add(G.table.activeJobs, jobCards);

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
              const activeProjects = G.table.activeProjects;
              const fulfilledProjects = ActiveProjects.FilterFulfilled(activeProjects);
              if (fulfilledProjects.length === 0) {
                return;
              }
              fulfilledProjects.forEach(project => {
                // Update Score
                Object.keys(G.players).forEach(playerId => {
                  const victoryPoints = ActiveProject.GetPlayerContribution(project, playerId);
                  G.players[playerId].victoryPoints += victoryPoints;
                });
                // Return Tokens
                Object.keys(G.players).forEach(playerId => {
                  const workerTokens = ActiveProject.GetPlayerWorkerTokens(project, playerId);
                  G.players[playerId].token.workers += workerTokens;
                });
              });
              // Update OpenSourceTree
              // Remove from table
              ActiveProjects.Remove(activeProjects, fulfilledProjects);
              // Discard Project Card
              const projectCards = fulfilledProjects.map(project => project.card);
              Deck.Discard(G.decks.projects, projectCards);
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
              const refillProject: MoveFn<OpenStarTerVillageType.State.Root> = (({G, ctx}) => {
                const maxProjectCards = 2;
                const refillCardNumber = maxProjectCards - G.players[ctx.currentPlayer].hand.projects.length;
                const projectCards = Deck.Draw(G.decks.projects, refillCardNumber);
                Cards.Add(G.players[ctx.currentPlayer].hand.projects, projectCards);
              });

              const refillForce: MoveFn<OpenStarTerVillageType.State.Root> = (({G, ctx}) => {
                const maxForceCards = 2;
                const refillCardNumber = maxForceCards - G.players[ctx.currentPlayer].hand.forces.length;
                const forceCards = Deck.Draw(G.decks.forces, refillCardNumber);
                Cards.Add(G.players[ctx.currentPlayer].hand.forces, forceCards);
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
              Object.keys(G.table.activeMoves).forEach(move => {
                G.table.activeMoves[move as keyof OpenStarTerVillageType.Move.ActionMoves] = true;
              });
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
    const publicPlayers: Record<PlayerID, PartialBy<OpenStarTerVillageType.State.Player, 'hand'>> = {};
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
