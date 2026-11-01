import { Client } from 'boardgame.io/client';
import { OpenStarTerVillage } from './game';
import { setup } from './core/setup';

test('the final round commits results without drawing beyond the last event', () => {
  const client = Client({
    game: {
      ...OpenStarTerVillage,
      setup: context => {
        const G = setup(context);
        G.decks.events.drawPile = G.decks.events.drawPile.filter(card => card.type === 'last_round');
        return G;
      },
    },
    numPlayers: 3,
  });
  client.start();

  for (let player = 0; player < 3; player++) client.moves.endActionTurn();

  const state = client.getState()!;
  expect(state.ctx.gameover).toEqual({ winners: ['0', '1', '2'] });
  expect(state.G.table.scoreBoard).toEqual({ '0': 4, '1': 4, '2': 4 });
  client.stop();
});
