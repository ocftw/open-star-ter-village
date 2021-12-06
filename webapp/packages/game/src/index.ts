import { Game, PlayerID } from 'boardgame.io';
import { OpenStarTerVillageType as type } from './types';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const OpenStarTerVillage: Game<type.State.Root> = {
  setup: (ctx) => {
    const rules: type.State.Root['rules'] = {};

    const players: type.State.Root['players'] = ctx.playOrder
      .reduce((s: Record<PlayerID, type.State.Player>, playerId) => {
        s[playerId] = {
          hand: { projects: [], resources: [] },
          workerTokens: 0,
          closedProjects: 0,
        };
        return s;
      }, {});

    const decks: type.State.Root['decks'] = {
      projects: {
        pile: [],
        discardPile: [],
      },
      resources: {
        pile: [],
        discardPile: [],
      },
      events: {
        pile: [],
        discardPile: [],
      },
    };

    const table: type.State.Root['table'] = {
      projects: [],
      max: 0,
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
        state.decks.events.pile = ctx.random!.Shuffle(state.decks.events.pile);

        state.decks.projects.pile = ctx.random!.Shuffle(state.decks.projects.pile);
        state.decks.resources.pile = ctx.random!.Shuffle(state.decks.resources.pile);

        state.decks.projects;
        for (let playerId in state.players) {
          const cards = state.decks.projects.pile.splice(0, 2);
          state.players[playerId].hand.projects.push(...cards);
        }

        state.decks.resources;
        for (let playerId in state.players) {
          const cards = state.decks.resources.pile.splice(0, 5);
          state.players[playerId].hand.resources.push(...cards);
        }

        for (let playerId in state.players) {
          state.players[playerId].workerTokens = 10;
        }
      },
    },
  },
  turn: {
    onBegin: () => {
      // roundStart do something
    },
    stages: {
      action: {
        moves: {
          createProject: () => { },
          recruit: () => { },
          contribute: () => { },
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
          }
        },
        next: 'refill',
      },
      refill: {
        moves: {
          drawProjects: () => { },
          drawResources: () => { },
        },
      },
    },
    onEnd: () => { },
  },
  playerView: (state, ctx, playerId) => {
    const { decks, players, ...view } = state;
    const publicPlayers: Record<PlayerID, PartialBy<type.State.Player, 'hand'>> = {};
    for (let id in players) {
      const { hand, ...player } = players[id];
      publicPlayers[id] = player;
    }

    if (playerId) {
      publicPlayers[playerId] = players[playerId];
    }

    return {
      ...view,
      players: publicPlayers,
    };
  },
};
