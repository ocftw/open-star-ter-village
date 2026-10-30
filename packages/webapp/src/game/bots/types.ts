import type { Ctx, PlayerID } from 'boardgame.io';
import type { ClientGameState } from '@/game/store/store';

/** A move a bot can submit; same `{ move, args }` shape as boardgame.io's `ai.enumerate`. */
export interface BotAction {
  move: string;
  args: unknown[];
}

/** What a bot may see when deciding: only its own player view, never decks or other hands. */
export interface BotContext {
  view: ClientGameState;
  ctx: Ctx;
  playerID: PlayerID;
  /** Seeded per game and seat so tie-breaks are reproducible. */
  random: () => number;
}

export interface Bot {
  name: string;
  decide(context: BotContext): BotAction;
}
