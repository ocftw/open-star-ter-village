import type { Game } from 'boardgame.io';
import { Client } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { createProfileBot } from './game/bots/profileBot';
import { seededRandom } from './game/bots/random';
import { activePlayer } from './game/bots/runner';
import { getBotStrategy } from './game/bots/seat';
import { isServerBotSeat } from './botSeats';
import type { ClientGameState } from './game/store/store';

interface PlayerMetadata {
  id: number;
  name?: string;
  credentials?: string;
  data?: unknown;
  isConnected?: boolean;
}

interface MatchMetadata {
  players: Record<number, PlayerMetadata>;
  setupData?: unknown;
  gameover?: unknown;
}

export interface BotRunnerStore {
  listMatches(opts: { gameName: string }): unknown;
  fetch(matchID: string, opts: { metadata: true }): unknown;
  wipe(matchID: string): unknown;
}

export interface BotRunnerOptions {
  db: BotRunnerStore;
  game: Game;
  /** URL the bots use to reach this game server over Socket.IO. */
  serverURL: string;
  pollMs?: number;
  /** Pause before each bot move so humans can follow the game. */
  moveDelayMs?: number;
  log?: (message: string) => void;
}

/** Resend a move only if the server has not answered it within this time. */
const MOVE_RETRY_MS = 5000;

interface SeatAssignment {
  matchID: string;
  playerID: string;
  credentials: string;
  strategy: string;
}

/** One bot seat: a multiplayer client that plays its seat from its own player view. */
class BotSeat {
  private readonly client;
  private readonly decide;
  private readonly random;
  private timer?: ReturnType<typeof setTimeout>;
  private lastDecidedStateID?: number;
  private lastDecidedAt = 0;

  constructor(private readonly seat: SeatAssignment, game: Game, serverURL: string, private readonly moveDelayMs: number, private readonly log: (message: string) => void) {
    const strategy = getBotStrategy({ bot: { strategy: seat.strategy } })!;
    this.decide = createProfileBot(strategy.profile).decide;
    this.random = seededRandom(`${seat.matchID}:${seat.playerID}`);
    this.client = Client({
      game,
      multiplayer: SocketIO({ server: serverURL, socketOpts: { transports: ['websocket'] } }),
      matchID: seat.matchID,
      playerID: seat.playerID,
      credentials: seat.credentials,
      debug: false,
    });
    this.client.subscribe(() => this.poke());
    this.client.start();
  }

  /** Schedules a move if it is this bot's turn and none is pending. */
  poke() {
    if (this.timer) return;
    const state = this.client.getState();
    if (!state?.isConnected || state.ctx.gameover || activePlayer(state.ctx) !== this.seat.playerID) return;
    const stateID = state._stateID;
    // Wait for the server's answer to the move already sent for this state.
    if (this.lastDecidedStateID === stateID && Date.now() - this.lastDecidedAt < MOVE_RETRY_MS) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      const now = this.client.getState();
      if (!now || now._stateID !== stateID || now.ctx.gameover || activePlayer(now.ctx) !== this.seat.playerID) return this.poke();
      if (this.lastDecidedStateID === stateID) this.log(`bot ${this.seat.matchID}:${this.seat.playerID} retrying a move the server did not apply`);
      this.lastDecidedStateID = stateID;
      this.lastDecidedAt = Date.now();
      try {
        const action = this.decide({ view: now.G as unknown as ClientGameState, ctx: now.ctx, playerID: this.seat.playerID, random: this.random });
        (this.client.moves as Record<string, (...args: unknown[]) => void>)[action.move](...action.args);
      } catch (error) {
        this.log(`bot ${this.seat.matchID}:${this.seat.playerID} failed to move: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, this.moveDelayMs);
  }

  stop() {
    clearTimeout(this.timer);
    this.client.stop();
  }
}

/**
 * Plays every bot seat of every started, unfinished match. Polls the match
 * store, connects a client per bot seat, and disconnects it when the game
 * ends, the match is terminated or deleted, or the seat is no longer a bot.
 */
export function startBotRunner({ db, game, serverURL, pollMs = 2000, moveDelayMs = 800, log = console.log }: BotRunnerOptions) {
  const seats = new Map<string, BotSeat>();

  async function wantedSeats(): Promise<Map<string, SeatAssignment>> {
    const wanted = new Map<string, SeatAssignment>();
    const matchIDs = (await db.listMatches({ gameName: game.name! })) as string[];
    for (const matchID of matchIDs) {
      const { metadata } = ((await db.fetch(matchID, { metadata: true })) ?? {}) as { metadata?: MatchMetadata };
      if (!metadata) continue;
      const players = Object.values(metadata.players);
      const bots = players.filter(isServerBotSeat);
      if (bots.length === 0) continue;
      const humans = players.filter(player => player.name?.trim() && !isServerBotSeat(player));
      // boardgame.io deletes a match once nobody is seated; bot seats keep their names, so finish the job.
      if (humans.length === 0) {
        await db.wipe(matchID);
        log(`match ${matchID} deleted: only bots were left`);
        continue;
      }
      if (metadata.gameover !== undefined) continue;
      if ((metadata.setupData as { ruleset?: unknown } | undefined)?.ruleset !== 'tree-poc-v1') continue;
      const started = (metadata.players[0]?.data as { started?: unknown } | undefined)?.started === true;
      // A vacated seat after start means the match was terminated (#420).
      if (!started || players.some(player => !player.name?.trim())) continue;
      // Pause bots while no human is connected; they resume when someone reconnects.
      if (!humans.some(player => player.isConnected)) continue;
      for (const player of bots) {
        const strategy = getBotStrategy(player.data);
        if (strategy && player.credentials) {
          wanted.set(`${matchID}:${player.id}`, { matchID, playerID: String(player.id), credentials: player.credentials, strategy: strategy.id });
        }
      }
    }
    return wanted;
  }

  async function tick() {
    const wanted = await wantedSeats();
    for (const [key, seat] of Array.from(seats)) {
      if (!wanted.has(key)) {
        seat.stop();
        seats.delete(key);
        log(`bot ${key} stopped`);
      }
    }
    for (const [key, assignment] of Array.from(wanted)) {
      const running = seats.get(key);
      if (running) running.poke();
      else {
        seats.set(key, new BotSeat(assignment, game, serverURL, moveDelayMs, log));
        log(`bot ${key} (${assignment.strategy}) started`);
      }
    }
  }

  let ticking = false;
  const interval = setInterval(() => {
    if (ticking) return;
    ticking = true;
    tick().catch(error => log(`bot runner tick failed: ${error instanceof Error ? error.message : String(error)}`)).finally(() => { ticking = false; });
  }, pollMs);

  return {
    tick,
    activeSeats: () => Array.from(seats.keys()),
    stop() {
      clearInterval(interval);
      for (const seat of Array.from(seats.values())) seat.stop();
      seats.clear();
    },
  };
}
