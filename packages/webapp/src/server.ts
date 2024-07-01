import { Server, Origins } from "boardgame.io/server";
import { OpenStarTerVillage } from "./game/game";

async function serve() {
  const port = Number(process.env.PORT) || 8000;
  const dev = process.env.NODE_ENV !== "production";

  console.log(`Starting server on port ${port} in ${dev ? 'dev' : 'production'} mode...`);

  const server = Server({
    games: [OpenStarTerVillage],
    origins: [
      // Allow localhost to connect, except when NODE_ENV is 'production'.
      Origins.LOCALHOST_IN_DEVELOPMENT,
    ],
  });
  const config = {
    port,
    callback: () => console.log(`Main server running on port ${port}...`),
  };

  server.run(config);
}

serve();
