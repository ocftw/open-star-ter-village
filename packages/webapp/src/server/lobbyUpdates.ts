import { PassThrough } from 'node:stream';
import type { Server } from 'boardgame.io/server';

type GameServer = ReturnType<typeof Server>;

/** Public invalidations only: clients fetch the normal filtered lobby API. */
export function registerLobbyUpdates(server: GameServer): () => void {
  const clients = new Set<PassThrough>();
  let pending = false;
  const notify = () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      clients.forEach((client) => client.write('data: changed\n\n'));
    });
  };
  const afterWrite = (result: void | Promise<void>) => {
    if (result) return result.then(notify);
    notify();
  };

  // These methods cover lobby requests and gameover/connectivity metadata
  // written by the game transport, while preserving sync and async adapters.
  const { db } = server;
  const createMatch = db.createMatch.bind(db);
  const setMetadata = db.setMetadata.bind(db);
  const wipe = db.wipe.bind(db);
  db.createMatch = (id, options) => afterWrite(createMatch(id, options));
  db.setMetadata = (id, metadata) => afterWrite(setMetadata(id, metadata));
  db.wipe = (id) => afterWrite(wipe(id));

  server.router.get('/lobby/updates', (ctx) => {
    const stream = new PassThrough();
    ctx.set('Content-Type', 'text/event-stream');
    ctx.set('Cache-Control', 'no-cache, no-transform');
    ctx.set('Connection', 'keep-alive');
    ctx.body = stream;
    clients.add(stream);
    // Every connection, including reconnects, asks for a fresh room list.
    stream.write('retry: 1000\ndata: changed\n\n');
    const heartbeat = setInterval(() => stream.write(': keep-alive\n\n'), 15_000);
    heartbeat.unref();
    ctx.res.once('close', () => {
      clearInterval(heartbeat);
      clients.delete(stream);
      stream.destroy();
    });
  });

  return () => {
    db.createMatch = createMatch;
    db.setMetadata = setMetadata;
    db.wipe = wipe;
    clients.forEach((client) => client.end());
    clients.clear();
  };
}
