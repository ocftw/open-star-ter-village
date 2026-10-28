import { NOVICE, ADVANCE, type Profile } from './profiles';

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
  novice: {
    id: 'novice',
    label: '新手型 Novice',
    description: '每一步選擇預期得分最高的行動，兼顧專案與星源樹。',
    names: ['小新', '菜菜', '嫩嫩', '初初', '萌萌', '阿學'],
    profile: NOVICE,
  },
  advance: {
    id: 'advance',
    label: '進階型 Advance',
    description: '少投資共享的星源樹、提高開案門檻，把行動用來完成自己的專案，搶在後手之前收尾。',
    names: ['老手', '高手', '阿達', '進進', '大師', '精精'],
    profile: ADVANCE,
  },
};

export const DEFAULT_BOT_STRATEGY = 'novice';

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
