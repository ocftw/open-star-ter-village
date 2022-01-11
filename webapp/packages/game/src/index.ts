import { Game, PlayerID } from 'boardgame.io';
import { Deck, newCardDeck } from './deck';
import { HandCards } from './handCards';
import { OpenStarTerVillageType as type } from './types';
import projectCards from './data/card/projects.json';
import resourceCards from './data/card/resources.json';
import eventCards from './data/card/events.json';
import goalCards from './data/card/goals.json';

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
      // TODO: update type.Card.Project, Resource, Event to be object
      projects: newCardDeck<type.Card.Project>(projectCards.map(card => card.name)),
      resources: newCardDeck<type.Card.Resource>(resourceCards.map(card => card.name)),
      events: newCardDeck<type.Card.Event>(eventCards.map(card => card.name)),
      goals: newCardDeck<type.Card.Goal>(goalCards.map(card => card.name)),
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
