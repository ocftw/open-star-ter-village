import { BOT_STRATEGIES, isBotStrategy, type BotStrategy } from './strategies';

/** Player metadata `data` of a bot seat, written by the server's bot seat endpoint. */
export interface BotSeatData {
  bot: { strategy: string };
}

/** The strategy of a seat if it holds a bot, from its lobby metadata `data`. */
export function getBotStrategy(data: unknown): BotStrategy | undefined {
  const strategy = (data as Partial<BotSeatData> | null | undefined)?.bot?.strategy;
  return isBotStrategy(strategy) ? BOT_STRATEGIES[strategy] : undefined;
}

export function isBotSeat(player: { data?: unknown }): boolean {
  return getBotStrategy(player.data) !== undefined;
}
