import { Game, PlayerID } from 'boardgame.io';
import { TurnOrder } from 'boardgame.io/core';
import { Deck } from './deck';
import { OpenStarTerVillageType as type } from './types';

export const OpenStarTerVillage: Game<type.RootState> = {
  setup: (ctx) => {
    const rules: type.RuleState = {};

    const players: Record<PlayerID, type.PlayerState> = ctx.playOrder.reduce((s, playerId) => {
      s[playerId] = {
        hand: { projects: [], resources: [] },
        workerTokens: 0,
        closedProjects: 0,
      };
      return s;
    }, {} as Record<PlayerID, type.PlayerState>);

    const decks = {
      projects: new Deck<type.ProjectCard>([], ctx.random!.Shuffle),
      resources: new Deck<type.ResourceCard>([], ctx.random!.Shuffle),
      events: new Deck<type.EventCard>([], ctx.random!.Shuffle),
    };

    const table = {
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
    createProject: () => { },
    recruit: () => { },
    contribute: () => { },
  },
  phases: {
    init: {
      start: true,
      onBegin: (state, ctx) => {
        // shuffle cards
        state.decks.events.shuffle();

        state.decks.projects.shuffle();
        for (let playerId in state.players) {
          const cards = state.decks.projects.draw(2);
          state.players[playerId].hand.projects.push(...cards);
        }

        state.decks.resources.shuffle();
        for (let playerId in state.players) {
          const cards = state.decks.resources.draw(5);
          state.players[playerId].hand.resources.push(...cards);
        }

        for (let playerId in state.players) {
          state.players[playerId].workerTokens = 10;
        }

        ctx.events!.endPhase();
      },
      turn: {
        moveLimit: 0,
        order: TurnOrder.ONCE,
      },
      moves: {},
      next: 'play',
    },
    play: {},
  },
  turn: {
    order: TurnOrder.RESET,
    onBegin: () => { },
    stages: {
      action: {},
      settle: {},
      discard: {},
      refill: {},
    },
    onEnd: () => { },
  },
};
