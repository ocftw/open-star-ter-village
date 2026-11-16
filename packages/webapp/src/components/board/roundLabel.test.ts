import { roundLabel } from './roundLabel';

it.each([
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
].map((numeral, index) => [index + 1, `回合${numeral}`] as const))('formats round %i as %s', (round, label) => {
  expect(roundLabel(round)).toBe(label);
});
