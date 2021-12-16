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
          token: { workers: 0 },
          completed: { projects: [] },
        };
        return s;
      }, {});

    const decks: type.State.Root['decks'] = {
      projects: {
        drawPile: [],
        discardPile: [],
      },
      resources: {
        drawPile: [],
        discardPile: [],
      },
      events: {
        drawPile: [],
        discardPile: [],
      },
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
        state.decks.events.drawPile = ctx.random!.Shuffle(state.decks.events.drawPile);

        state.decks.projects.drawPile = ctx.random!.Shuffle(state.decks.projects.drawPile);
        state.decks.resources.drawPile = ctx.random!.Shuffle(state.decks.resources.drawPile);

        state.decks.projects;
        for (let playerId in state.players) {
          const cards = state.decks.projects.drawPile.splice(0, 2);
          state.players[playerId].hand.projects.push(...cards);
        }

        state.decks.resources;
        for (let playerId in state.players) {
          const cards = state.decks.resources.drawPile.splice(0, 5);
          state.players[playerId].hand.resources.push(...cards);
        }

        for (let playerId in state.players) {
          state.players[playerId].token.workers = 10;
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
