const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** The event deck keeps rounds below 100. */
export function roundLabel(round: number): string {
  const numeral = round < 10
    ? DIGITS[round]
    : `${round < 20 ? '' : DIGITS[Math.floor(round / 10)]}十${round % 10 ? DIGITS[round % 10] : ''}`;
  return `回合${numeral}`;
}
