import { Origins, Server } from 'boardgame.io/server';
import game from './game';

async function serve() {
  const port = Number(process.env.PORT || 3001);
  const dev = process.env.NODE_ENV !== 'production';
  const origins = process.env.GAME_SERVER_ORIGINS
    ? process.env.GAME_SERVER_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
    : [Origins.LOCALHOST_IN_DEVELOPMENT];

  console.log(`Starting server on port ${port} in ${dev ? 'dev' : 'production'} mode...`);

  const server = Server({
    games: [game],
    origins,
  });
  const config = {
    port,
    callback: () => console.log(`Main server running on port ${port}...`),
  };

  server.run(config);
}

serve();
