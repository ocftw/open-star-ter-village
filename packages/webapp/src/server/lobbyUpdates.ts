import { PassThrough } from 'node:stream';
import type { Socket } from 'node:net';
import type { Server } from 'boardgame.io/server';

type GameServer = ReturnType<typeof Server>;

/** Public invalidations only: clients fetch the normal filtered lobby API. */
export function registerLobbyUpdates(server: GameServer): () => void {
  const clients = new Set<PassThrough>();
  const sockets = new Set<Socket>();
  const heartbeats = new Set<ReturnType<typeof setInterval>>();
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
    const socket = ctx.res.socket;
    if (socket) sockets.add(socket);
    // Every connection, including reconnects, asks for a fresh room list.
    stream.write('retry: 1000\ndata: changed\n\n');
    const heartbeat = setInterval(() => stream.write(': keep-alive\n\n'), 15_000);
    heartbeat.unref();
    heartbeats.add(heartbeat);
    ctx.res.once('close', () => {
      clearInterval(heartbeat);
      heartbeats.delete(heartbeat);
      clients.delete(stream);
      if (socket) sockets.delete(socket);
      stream.destroy();
    });
  });

  return () => {
    db.createMatch = createMatch;
    db.setMetadata = setMetadata;
    db.wipe = wipe;
    heartbeats.forEach(clearInterval);
    heartbeats.clear();
    clients.forEach((client) => {
      client.end();
      client.destroy();
    });
    clients.clear();
    // Ending the stream is not enough while the client still holds the fetch:
    // Node keeps the HTTP connection open, so Socket.IO's close never settles.
    sockets.forEach((socket) => {
      if (!socket.destroyed) socket.destroy();
    });
    sockets.clear();
  };
}
