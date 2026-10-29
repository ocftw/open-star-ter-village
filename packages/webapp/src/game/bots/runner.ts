import type { StandardExperiments } from '@/game/standard/config';
import type { StandardOptions } from '@/game/standard/options';
import type { Ctx, PlayerID, State } from 'boardgame.io';
import { CreateGameReducer, InitializeGame } from 'boardgame.io/internal';
import { OpenStarTerVillage } from '@/game/game';
import { playerView } from '@/game/core/playerView';
import type { GameState } from '@/game/store/store';
import { advancedScoreGate } from '@/game/standard/tree';
import { seededRandom } from './random';
import type { Bot, BotAction } from './types';

export interface MoveRecord {
  step: number;
  round: number;
  playerID: PlayerID;
  move: string;
  args: unknown[];
}

export interface GameSpec {
  numPlayers: number;
  seed: string;
  /** One bot for every seat, or a bot per seat. */
  bots: Bot | Record<PlayerID, Bot>;
  /** Fail the game if it has not ended after this many moves. */
  stepLimit?: number;
  experiments?: StandardExperiments;
  standardOptions?: StandardOptions;
  forcedFirstEvent?: string;
  /** Offline historical comparisons only; never sent through room creation. */
  legacyExperiments?: boolean;
}

export interface GameRun {
  seed: string;
  numPlayers: number;
  state: State<GameState>;
  moves: MoveRecord[];
  /** First observed in-play round above the current advanced gate; excludes final scoring. */
  firstAdvancedGateRound: Record<PlayerID, number>;
}

/** A bot game that could not continue; carries enough to replay it. */
export class BotGameError extends Error {
  constructor(message: string, readonly seed: string, readonly step: number, readonly action?: BotAction & { playerID: PlayerID }) {
    super(`${message} (seed ${seed}, step ${step}${action ? `, ${action.playerID} ${action.move} ${JSON.stringify(action.args)}` : ''})`);
    this.name = 'BotGameError';
  }
}

export function botGame(seed: string) {
  return { ...OpenStarTerVillage, seed, disableUndo: true };
}

/** The single player who may act now: a choice owner, or the current player in the action stage. */
export function activePlayer(ctx: Ctx): PlayerID {
  return ctx.activePlayers ? Object.keys(ctx.activePlayers)[0] : ctx.currentPlayer;
}

export function initialState(numPlayers: number, seed: string, experiments?: StandardExperiments, standardOptions?: StandardOptions, forcedFirstEvent?: string, legacyExperiments = false): State<GameState> {
  const state = InitializeGame({ game: botGame(seed), numPlayers, setupData: { ruleset: 'tree-poc-v1', experiments: legacyExperiments && experiments ? { ...experiments, government5: 'any' } : experiments, standardOptions, forcedFirstEvent } }) as State<GameState>;
  // No project exists at initialization, so Government 5 cannot have fired.
  // Restore the retired option only for explicitly requested offline trials.
  if (legacyExperiments && experiments) {
    const restored = structuredClone(state);
    restored.G.standard!.experiments = { ...experiments };
    return restored;
  }
  return state;
}

export function gameReducer(seed: string) {
  const reducer = CreateGameReducer({ game: botGame(seed) });
  return (state: State<GameState>, playerID: PlayerID, action: BotAction): State<GameState> =>
    reducer(state, { type: 'MAKE_MOVE', payload: { type: action.move, args: action.args, playerID } }) as State<GameState>;
}

/** Observe eligibility after a move, labelled with the round that produced it. */
export function recordAdvancedAccess(state: State<GameState>, round: number, first: Record<PlayerID, number>): void {
  if (state.ctx.gameover) return;
  const gate = advancedScoreGate(state.G);
  for (const [seat, score] of Object.entries(state.G.table.scoreBoard)) {
    if (score > gate && first[seat] === undefined) first[seat] = round;
  }
}

/**
 * Plays one Standard game headless with the authoritative game reducer.
 * Each bot sees only its own player view. A move the game rejects fails the
 * run immediately instead of being retried.
 */
export function runGame({ numPlayers, seed, bots, stepLimit = 2000, experiments, standardOptions, forcedFirstEvent, legacyExperiments }: GameSpec): GameRun {
  const reduce = gameReducer(seed);
  let state = initialState(numPlayers, seed, experiments, standardOptions, forcedFirstEvent, legacyExperiments);
  const seatRandom: Record<PlayerID, () => number> = {};
  const moves: MoveRecord[] = [];
  const firstAdvancedGateRound: Record<PlayerID, number> = {};

  for (let step = 0; !state.ctx.gameover; step++) {
    if (step >= stepLimit) throw new BotGameError(`Game did not end within ${stepLimit} moves`, seed, step);
    const playerID = activePlayer(state.ctx);
    const bot = 'decide' in bots ? (bots as Bot) : (bots as Record<PlayerID, Bot>)[playerID];
    seatRandom[playerID] ??= seededRandom(`${seed}:${playerID}`);
    const view = playerView({ G: state.G, ctx: state.ctx, playerID });
    const action = bot.decide({ view, ctx: state.ctx, playerID, random: seatRandom[playerID] });
    const next = reduce(state, playerID, action);
    if (next._stateID === state._stateID) throw new BotGameError('Move rejected', seed, step, { ...action, playerID });
    moves.push({ step, round: state.G.standard?.round ?? 0, playerID, move: action.move, args: action.args });
    recordAdvancedAccess(next, state.G.standard!.round, firstAdvancedGateRound);
    state = next;
  }
  return { seed, numPlayers, state, moves, firstAdvancedGateRound };
}
