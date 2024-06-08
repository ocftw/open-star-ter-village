import { Server, Origins } from "boardgame.io/server";
import { OpenStarTerVillage } from "./game";

async function serve() {
  const port = Number(process.env.PORT) || 8000;
  const apiPort = Number(process.env.API_PORT) || 8080;

  const server = Server({
    games: [OpenStarTerVillage],
    origins: [
      // Allow localhost to connect, except when NODE_ENV is 'production'.
      Origins.LOCALHOST_IN_DEVELOPMENT,
    ],
  });
  const mainServerConfig = {
    port,
    callback: () => console.log(`Main server running on port ${port}...`),
  };
  const lobbyConfig = {
    apiPort,
    apiCallback: () => console.log(`Lobby api running on port ${apiPort}`),
  };

  server.run({
    ...mainServerConfig,
    lobbyConfig,
  });
}

serve();
