import { Game, PlayerID, State } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { Deck, newCardDeck } from './deck';
import { Cards } from './cards';
import { OpenStarTerVillageType as type } from './types';
import projectCards from './data/card/projects.json';
import jobCards from './data/card/jobs.json';
import forceCards from './data/card/forces.json';
import eventCards from './data/card/events.json';
import goalCards from './data/card/goals.json';
import { isInRange, zip } from './utils';
import { ActiveProject, ActiveProjects } from './activeProjects';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type WithGameState<G extends any, F extends (...args: any) => void> = (G: State<G>['G'], ctx: State<G>['ctx'], ...args: Parameters<F>) => any;

export const OpenStarTerVillage: Game<type.State.Root> = {
  setup: (ctx) => {
    const rules: type.State.Root['rules'] = {};

    const players: type.State.Root['players'] = ctx.playOrder
      .reduce((s: Record<PlayerID, type.State.Player>, playerId) => {
        s[playerId] = {
          hand: { projects: [], forces: [] },
          token: { workers: 0, actions: 0 },
          completed: { projects: [] },
          victoryPoints: 0,
        };
        return s;
      }, {});

    const decks: type.State.Root['decks'] = {
      projects: newCardDeck<type.Card.Project>(projectCards as unknown as type.Card.Project[]),
      jobs: newCardDeck<type.Card.Job>(jobCards),
      forces: newCardDeck<type.Card.Force>(forceCards),
      events: newCardDeck<type.Card.Event>(eventCards),
      goals: newCardDeck<type.Card.Goal>(goalCards),
    };

    const table: type.State.Root['table'] = {
      activeEvent: null,
      activeProjects: [],
      activeJobs: [],
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
        Deck.ShuffleDrawPile(state.decks.forces, shuffler);
        Deck.ShuffleDrawPile(state.decks.jobs, shuffler);
        Deck.ShuffleDrawPile(state.decks.goals, shuffler);

        const maxProjectCards = 2;
        for (let playerId in state.players) {
          const projectCards = Deck.Draw(state.decks.projects, maxProjectCards);
          Cards.Add(state.players[playerId].hand.projects, projectCards);
        }

        const maxForceCards = 2;
        for (let playerId in state.players) {
          const forceCards = Deck.Draw(state.decks.forces, maxForceCards);
          Cards.Add(state.players[playerId].hand.forces, forceCards);
        }

        const maxJobCards = 5;
        const jobCards = Deck.Draw(state.decks.jobs, maxJobCards);
        Cards.Add(state.table.activeJobs, jobCards);

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
            // client cannot see decks, discard job card should evaluated on server side
            client: false,
            move: ((G, ctx, projectCardIndex, jobCardIndex) => {
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
              const currentHandProjects = G.players[currentPlayer].hand.projects;
              if (!isInRange(projectCardIndex, currentHandProjects.length)) {
                return INVALID_MOVE;
              }

              // check job card is on the table
              const currentJobs = G.table.activeJobs;
              if (!isInRange(jobCardIndex, currentJobs.length)) {
                return INVALID_MOVE;
              }

              // check job card is required in project
              const projectCard = Cards.GetById(currentHandProjects, projectCardIndex);
              const jobCard = Cards.GetById(currentJobs, jobCardIndex);
              if (!Object.keys(projectCard.requirements).includes(jobCard.name)) {
                return INVALID_MOVE;
              }

              // reduce action tokens
              currentPlayerToken.actions -= createProjectActionCosts;
              Cards.RemoveOne(currentHandProjects, projectCard);
              Cards.RemoveOne(currentJobs, jobCard);

              // initial active project
              const activeProjectIndex = ActiveProjects.Add(G.table.activeProjects, projectCard, currentPlayer);
              const activeProject = ActiveProjects.GetById(G.table.activeProjects, activeProjectIndex);

              // reduce worker token
              currentPlayerToken.workers -= createProjectWorkerCosts;
              // assign worker token
              const jobInitPoints = 1;
              ActiveProject.AssignWorker(activeProject, jobCard.name, currentPlayer, jobInitPoints);
              // score victory points
              const createProjectVictoryPoints = 1;
              G.players[currentPlayer].victoryPoints += createProjectVictoryPoints;

              // discard job card
              Deck.Discard(G.decks.jobs, [jobCard]);
            }) as WithGameState<type.State.Root, type.Move.CreateProject>,
          },
          recruit: {
            // client cannot see decks, discard job card should evaluated on server side
            client: false,
            move: ((G, ctx, jobCardIndex, activeProjectIndex) => {
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

              const currentJob = G.table.activeJobs;
              if (!isInRange(jobCardIndex, currentJob.length)) {
                return INVALID_MOVE;
              }

              const activeProjects = G.table.activeProjects
              if (!isInRange(activeProjectIndex, activeProjects.length)) {
                return INVALID_MOVE;
              }
              const jobCard = Cards.GetById(currentJob, jobCardIndex);
              const activeProject = ActiveProjects.GetById(G.table.activeProjects, activeProjectIndex);
              const jobContribution = ActiveProject.GetJobContribution(activeProject, jobCard.name);
              // Check job requirment is not fulfilled yet
              if (!(jobContribution < activeProject.card.requirements[jobCard.name])) {
                return INVALID_MOVE;
              }
              // User cannot place more than one worker in same job
              if (ActiveProject.HasWorker(activeProject, jobCard.name, currentPlayer)) {
                return INVALID_MOVE;
              }

              // reduce action
              currentPlayerToken.actions -= recruitActionCosts;
              Cards.RemoveOne(currentJob, jobCard);

              // reduce worker tokens
              currentPlayerToken.workers -= recruitWorkerCosts;
              // assign worker token
              const jobInitPoints = 1;
              ActiveProject.AssignWorker(activeProject, jobCard.name, currentPlayer, jobInitPoints);

              // discard job card
              Deck.Discard(G.decks.jobs, [jobCard]);
            }) as WithGameState<type.State.Root, type.Move.Recruit>,
          },
          contributeOwnedProjects: ((G, ctx, contributions) => {
            const currentPlayer = ctx.playerID!;
            const currentPlayerToken = G.players[currentPlayer].token;
            const contributeActionCosts = 1;
            if (currentPlayerToken.actions < contributeActionCosts) {
              return INVALID_MOVE;
            }
            const activeProjects = G.table.activeProjects
            const isInvalid = contributions.map(({ activeProjectIndex, jobName }) => {
              if (!isInRange(activeProjectIndex, activeProjects.length)) {
                return true;
              }
              const activeProject = ActiveProjects.GetById(activeProjects, activeProjectIndex);
              if (activeProject.owner !== currentPlayer) {
                return true;
              }

              if (!ActiveProject.HasWorker(activeProject, jobName, currentPlayer)) {
                return true;
              }
            }).some(x => x);
            if (isInvalid) {
              return INVALID_MOVE;
            }
            const totalContributions = contributions.map(({ value }) => value).reduce((a, b) => a + b, 0);
            const maxOwnedContributions = 4;
            if (!(totalContributions <= maxOwnedContributions)) {
              return INVALID_MOVE;
            }

            // deduct action tokens
            currentPlayerToken.actions -= contributeActionCosts;
            contributions.forEach(({ activeProjectIndex, jobName, value }) => {
              // update contributions to given contribution points
              const activeProject = ActiveProjects.GetById(G.table.activeProjects, activeProjectIndex);
              ActiveProject.PushWorker(activeProject, jobName, currentPlayer, value);
            });
          }) as WithGameState<type.State.Root, type.Move.ContributeOwnedProjects>,
          contributeJoinedProjects: ((G, ctx, contributions) => {
            const currentPlayer = ctx.playerID!;
            const currentPlayerToken = G.players[currentPlayer].token;
            const contributeActionCosts = 1;
            if (currentPlayerToken.actions < contributeActionCosts) {
              return INVALID_MOVE;
            }
            const activeProjects = G.table.activeProjects
            const isInvalid = contributions.map(({ activeProjectIndex, jobName }) => {
              if (!isInRange(activeProjectIndex, activeProjects.length)) {
                return true;
              }
              const activeProject = ActiveProjects.GetById(activeProjects, activeProjectIndex);
              if (activeProject.owner === currentPlayer) {
                return true;
              }

              if (!ActiveProject.HasWorker(activeProject, jobName, currentPlayer)) {
                return true;
              }
            }).some(x => x);
            if (isInvalid) {
              return INVALID_MOVE;
            }
            const totalContributions = contributions.map(({ value }) => value).reduce((a, b) => a + b, 0);
            const maxJoinedContributions = 3;
            if (!(totalContributions <= maxJoinedContributions)) {
              return INVALID_MOVE;
            }

            // deduct action tokens
            currentPlayerToken.actions -= contributeActionCosts;
            contributions.forEach(({ activeProjectIndex, jobName, value }) => {
              // update contributions to given contribution points
              const activeProject = ActiveProjects.GetById(G.table.activeProjects, activeProjectIndex);
              ActiveProject.PushWorker(activeProject, jobName, currentPlayer, value);
            });
          }) as WithGameState<type.State.Root, type.Move.ContributeJoinedProjects>,
          refillJob: ((G) => {
            const maxJobCards = 5;
            const refillCardNumber = maxJobCards - G.table.activeJobs.length;
            const jobCards = Deck.Draw(G.decks.jobs, refillCardNumber);
            Cards.Add(G.table.activeJobs, jobCards);
          }) as WithGameState<type.State.Root, type.Move.RefillJob>,
        },
        next: 'settle',
      },
      settle: {
        moves: {
          settle: {
            client: false,
            // client trigger settle project and move on to next stage
            move: ((G) => {
              const activeProjects = G.table.activeProjects;
              const fulfilledProjects = ActiveProjects.FilterFulfilled(activeProjects);
              if (fulfilledProjects.length === 0) {
                return;
              }
              fulfilledProjects.forEach(project => {
                // Update Score / Goals
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
            }) as WithGameState<type.State.Root, type.Move.Settle>,
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
            const refillProject = ((G, ctx) => {
              const maxProjectCards = 2;
              const refillCardNumber = maxProjectCards - G.players[ctx.currentPlayer].hand.projects.length;
              const projectCards = Deck.Draw(G.decks.projects, refillCardNumber);
              Cards.Add(G.players[ctx.currentPlayer].hand.projects, projectCards);
            }) as WithGameState<type.State.Root, type.Move.RefillProject>;

            const refillForce = ((G, ctx) => {
              const maxForceCards = 2;
              const refillCardNumber = maxForceCards - G.players[ctx.currentPlayer].hand.forces.length;
              const forceCards = Deck.Draw(G.decks.forces, refillCardNumber);
              Cards.Add(G.players[ctx.currentPlayer].hand.forces, forceCards);
            }) as WithGameState<type.State.Root, type.Move.RefillForce>;

            // refill cards
            refillProject(G, ctx);
            refillForce(G, ctx);

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
