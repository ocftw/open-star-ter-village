import { OpenStarTerVillage } from '@open-star-ter-village/webapp-game';
import { Server, Origins } from 'boardgame.io/server';

const server = Server({
  games: [OpenStarTerVillage],
  origins: [
    // Allow localhost to connect, except when NODE_ENV is 'production'.
    Origins.LOCALHOST_IN_DEVELOPMENT
  ]
});

const lobbyConfig = {
  apiPort: 8080,
  apiCallback: () => console.log('Lobby api running on port 8080'),
};

server.run({
  port: 8000,
  lobbyConfig,
  callback: () => console.log('Main server running on port 8000...'),
});
