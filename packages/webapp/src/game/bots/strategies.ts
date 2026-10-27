import { BALANCED, type Profile } from './profiles';

/** A bot strategy players can seat in a room. Add new strategies here. */
export interface BotStrategy {
  id: string;
  label: string;
  description: string;
  /** Seat names for this strategy; a room never seats two bots with the same name. */
  names: string[];
  profile: Profile;
}

export const BOT_STRATEGIES: Record<string, BotStrategy> = {
  balanced: {
    id: 'balanced',
    label: '平衡型 Balanced',
    description: '每一步選擇預期得分最高的行動，兼顧專案與星源樹。',
    names: ['阿衡', '天平', '均均', '中和', '小秤', '平平'],
    profile: BALANCED,
  },
};

export const DEFAULT_BOT_STRATEGY = 'balanced';

export function isBotStrategy(id: unknown): id is keyof typeof BOT_STRATEGIES {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(BOT_STRATEGIES, id);
}

/** First name from the strategy's list not already used in the room; numbered once the list runs out. */
export function pickBotName(strategyId: string, takenNames: string[]): string {
  const { names } = BOT_STRATEGIES[strategyId];
  const taken = new Set(takenNames);
  const free = names.find(name => !taken.has(name));
  if (free) return free;
  for (let n = 2; ; n++) {
    const candidate = `${names[0]} ${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
