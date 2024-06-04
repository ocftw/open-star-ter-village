import { Server, Origins } from "boardgame.io/server";
import next from 'next';
import url from "url";
import { OpenStarTerVillage } from "./game";

async function serve() {
  const port = Number(process.env.PORT) || 8000;
  const apiPort = Number(process.env.API_PORT) || 8080;
  const dev = process.env.NODE_ENV !== 'production';
  const app = next({ dev });
  const handle = app.getRequestHandler();

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

  await app.prepare();
  server.run({
    ...mainServerConfig,
    lobbyConfig,
  }, () => {
    server.app.use(async (ctx, next) => {
      const parsedUrl = url.parse(ctx.req.url!, true);
      await handle(ctx.req, ctx.res, parsedUrl);
      ctx.respond = false;
      await next();
    });
  });
}

serve();
