import { OpenStarTerVillage } from '@open-star-ter-village/webapp-game';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';

const Boardgame = Client({
  game: OpenStarTerVillage,
  multiplayer: Local(),
});

export default Boardgame;
