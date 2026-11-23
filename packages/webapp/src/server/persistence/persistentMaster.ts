import type { Game } from 'boardgame.io';
import { getFilterPlayerView } from 'boardgame.io/internal';
import { Master } from 'boardgame.io/master';
import { SocketIO } from 'boardgame.io/server';
import { StaleStateError } from './memberStore';
import { reportPersistenceFailure } from './report';

type MasterArgs = ConstructorParameters<typeof Master>;
type MasterTransport = MasterArgs[2];
type Storage = MasterArgs[1];
type Auth = MasterArgs[3];
type Broadcast = Parameters<MasterTransport['sendAll']>[0];
type SyncPayload = Omit<Extract<Parameters<MasterTransport['send']>[0], { type: 'sync' }>, 'playerID'>;
type UpdateArgs = Parameters<Master['onUpdate']>;

/**
 * Thin Master subclass (no boardgame.io patch): stock `Master.onUpdate`
 * broadcasts the new state before it awaits storage. This subclass holds the
 * broadcast until the storage write attempt has settled, then publishes it.
 *
 * - Transient write failure: the store resolves (memory keeps the move), so
 *   the move is published and play goes on (DB-C7, DB-C8).
 * - Hard `_stateID` reject: the held broadcast is dropped, never published as
 *   success; the moving client gets an authoritative `sync` to reconcile, and
 *   the reject is logged and reported without seat credentials (DB-P9).
 */
export class PersistentMaster extends Master {
  private readonly outbox: { held: Broadcast[] | null };
  private readonly downstream: MasterTransport;

  constructor(game: MasterArgs[0], storage: Storage, transport: MasterTransport, auth?: Auth) {
    const outbox: { held: Broadcast[] | null } = { held: null };
    super(game, storage, {
      send: (data) => transport.send(data),
      sendAll: (payload) => (outbox.held ? outbox.held.push(payload) : transport.sendAll(payload)),
    }, auth);
    this.outbox = outbox;
    this.downstream = transport;
  }

  async onUpdate(...args: UpdateArgs): Promise<Awaited<ReturnType<Master['onUpdate']>>> {
    const [credAction, , matchID, playerID] = args;
    const held: Broadcast[] = [];
    this.outbox.held = held;
    let result: Awaited<ReturnType<Master['onUpdate']>>;
    try {
      result = await super.onUpdate(...args);
    } catch (error) {
      this.outbox.held = null;
      if (!(error instanceof StaleStateError)) throw error;
      await this.rejectStale(matchID, playerID, credAction?.payload?.type);
      return { error: 'stale state rejected' };
    }
    this.outbox.held = null;
    // The write attempt has settled: publish.
    for (const payload of held) this.downstream.sendAll(payload);
    return result;
  }

  async onConnectionChange(
    ...args: Parameters<Master['onConnectionChange']>
  ): Promise<Awaited<ReturnType<Master['onConnectionChange']>>> {
    try {
      return await super.onConnectionChange(...args);
    } catch (error) {
      if (!(error instanceof StaleStateError)) throw error;
      reportPersistenceFailure('stale-state-rejected', { matchID: args[0] });
      return { error: 'stale state rejected' };
    }
  }

  private async rejectStale(matchID: string, playerID: string | null | undefined, actionType: unknown) {
    // Only the match ID and the move name: never the action payload, which
    // carries the seat credentials.
    console.warn('Stale match state rejected; reconciling client', {
      matchID,
      playerID,
      action: typeof actionType === 'string' ? actionType : undefined,
    });
    reportPersistenceFailure('stale-state-rejected', { matchID });
    const { state, metadata, initialState } = await this.storageAPI.fetch(matchID, {
      state: true,
      metadata: true,
      initialState: true,
    });
    if (!state || playerID === undefined) return;
    const filteredMetadata = Object.values(metadata?.players ?? {}).map(
      ({ credentials: _credentials, ...player }) => player,
    );
    const sync: SyncPayload = {
      type: 'sync',
      args: [matchID, { state, filteredMetadata, initialState, log: [] }],
    };
    this.downstream.send({ ...sync, playerID: playerID as string });
  }
}

// Structural socket.io types (socket.io is boardgame.io's dependency, not ours).
type Socket = {
  id: string;
  emit(event: string, ...args: unknown[]): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, listener: (...args: any[]) => unknown): void;
  join(room: string): void;
};
type Namespace = {
  removeAllListeners(event: string): void;
  on(event: 'connection', listener: (socket: Socket) => void): void;
};
type Client = { matchID: string; playerID: string; socket: Socket; credentials: string | undefined };
type SocketIOInternals = {
  removeClient(socketID: string): void;
  addClient(client: Client, game: Game): void;
  pubSub: { publish(channel: string, payload: Broadcast): void };
  clientInfo: Map<string, Client>;
};
type InitArgs = Parameters<SocketIO['init']>;

/**
 * boardgame.io's SocketIO transport, with its per-socket handlers re-registered
 * to run {@link PersistentMaster}. Everything else (rooms, pub/sub, per-match
 * queue) is the stock transport. Mirrors boardgame.io 0.50.2's handlers.
 */
export class PersistentSocketIO extends SocketIO {
  init(app: InitArgs[0], games: InitArgs[1], origins?: InitArgs[2]): void {
    super.init(app, games, origins);
    const io = (app as unknown as { _io: { of(name: string): Namespace } })._io;
    const internals = this as unknown as SocketIOInternals;
    const db = app.context.db as Storage;
    const auth = app.context.auth as Auth;
    for (const game of games) {
      const nsp = io.of(game.name!);
      nsp.removeAllListeners('connection');
      const filterPlayerView = getFilterPlayerView(game);
      const transport = (matchID: string, socket: Socket): MasterTransport => ({
        send: ({ playerID, ...data }) => {
          const { type, args } = filterPlayerView(playerID, data);
          socket.emit(type, ...args);
        },
        // Same channel name as boardgame.io's SocketIO (getPubSubChannelId).
        sendAll: (payload) => internals.pubSub.publish(`MATCH-${matchID}`, payload),
      });
      const master = (matchID: string, socket: Socket) => new PersistentMaster(game, db, transport(matchID, socket), auth);

      nsp.on('connection', (socket: Socket) => {
        socket.on('update', async (...args: UpdateArgs) => {
          const [action, stateID, matchID, playerID] = args;
          await this.getMatchQueue(matchID).add(() =>
            master(matchID, socket).onUpdate(action, stateID, matchID, playerID),
          );
        });
        socket.on('sync', async (matchID: string, playerID: string, credentials?: string, numPlayers?: number) => {
          socket.join(matchID);
          internals.removeClient(socket.id);
          const m = master(matchID, socket);
          const syncResponse = await m.onSync(matchID, playerID, credentials, numPlayers);
          if (syncResponse && syncResponse.error === 'unauthorized') return;
          internals.addClient({ socket, matchID, playerID, credentials }, game);
          await m.onConnectionChange(matchID, playerID, credentials, true);
        });
        socket.on('disconnect', async () => {
          const client = internals.clientInfo.get(socket.id);
          internals.removeClient(socket.id);
          if (client) {
            const { matchID, playerID, credentials } = client;
            await master(matchID, socket).onConnectionChange(matchID, playerID, credentials, false);
          }
        });
        socket.on('chat', async (matchID: string, chatMessage: Parameters<Master['onChatMessage']>[1], credentials?: string) => {
          master(matchID, socket).onChatMessage(matchID, chatMessage, credentials);
        });
      });
    }
  }
}
