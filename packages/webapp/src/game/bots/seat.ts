import { BOT_STRATEGIES, isBotStrategy, type BotStrategy } from './strategies';

/** Player metadata `data` of a bot seat, written by the server's bot seat endpoint. */
export interface BotSeatData {
  bot: { strategy: string };
}

/** Ids before Balanced/Counter became Novice/Advance; seats saved under them keep playing. */
const RENAMED_STRATEGIES: Record<string, string> = { balanced: 'novice', counter: 'advance' };

/** The strategy of a seat if it holds a bot, from its lobby metadata `data`. */
export function getBotStrategy(data: unknown): BotStrategy | undefined {
  const saved = (data as Partial<BotSeatData> | null | undefined)?.bot?.strategy;
  const strategy = typeof saved === 'string' && Object.prototype.hasOwnProperty.call(RENAMED_STRATEGIES, saved) ? RENAMED_STRATEGIES[saved] : saved;
  return isBotStrategy(strategy) ? BOT_STRATEGIES[strategy] : undefined;
}

export function isBotSeat(player: { data?: unknown }): boolean {
  return getBotStrategy(player.data) !== undefined;
}
