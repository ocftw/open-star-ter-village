// Change this one line and redeploy to stop creation of Standard rooms.
export const STANDARD_RULES_ENABLED = true;
export interface StandardExperiments {
  government5: 'existing' | 'any';
  completionRewards: 'fixed' | 'difficulty';
}
export const DEFAULT_EXPERIMENTS: StandardExperiments = {government5:'existing', completionRewards:'fixed'};
/** The four rule-option combinations bot trials compare; A is the default rules. */
export const EXPERIMENT_SCENARIOS: { id: 'A' | 'B' | 'C' | 'D'; experiments: StandardExperiments }[] = [
  { id: 'A', experiments: { government5: 'existing', completionRewards: 'fixed' } },
  { id: 'B', experiments: { government5: 'any', completionRewards: 'fixed' } },
  { id: 'C', experiments: { government5: 'existing', completionRewards: 'difficulty' } },
  { id: 'D', experiments: { government5: 'any', completionRewards: 'difficulty' } },
];
export function experimentLabel(value?: StandardExperiments): string {
  const e = value ?? DEFAULT_EXPERIMENTS;
  return `政府 5：${e.government5 === 'any' ? '不限既有方塊' : '僅既有方塊'} · 結案獎勵：${e.completionRewards === 'difficulty' ? '發起／結案各依星數 +1～+4' : '發起／結案各 +2'}`;
}
export function government5Description(value?: StandardExperiments): string {
  return '發起人貢獻的一半（無條件捨去），分配至其他專案，不超過需求。' +
    (value?.government5 === 'any'
      ? '可選任一未滿職業；若沒有自己的方塊，消耗 1 個庫存人力方塊新增，不消耗人力卡或 AP。增加既有方塊的貢獻不再消耗庫存。'
      : '只能增加自己的既有方塊。');
}
export function completionReward(value: StandardExperiments | undefined, difficulty: number, fixed: number): number {
  return value?.completionRewards === 'difficulty' ? difficulty : fixed;
}
export type Ruleset = 'simple' | 'tree-poc-v1';
export function roomSetupError(data: unknown, count: number, enabled = STANDARD_RULES_ENABLED): string | undefined {
  const ruleset = (data as { ruleset?: unknown } | undefined)?.ruleset === undefined ? 'simple' : (data as { ruleset: unknown }).ruleset;
  if (ruleset !== 'simple' && ruleset !== 'tree-poc-v1') return 'Unknown ruleset';
  if (ruleset === 'tree-poc-v1' && !enabled) return 'Standard Mode is disabled';
  const experiments = (data as {experiments?: unknown} | undefined)?.experiments;
  if (experiments !== undefined) {
    if (ruleset !== 'tree-poc-v1') return 'Experiments require Standard Mode';
    if (!experiments || typeof experiments !== 'object' || Array.isArray(experiments)) return 'Invalid experiments';
    const e = experiments as Record<string, unknown>;
    if (Object.keys(e).some(key => key !== 'government5' && key !== 'completionRewards') ||
        !['existing','any'].includes(e.government5 as string) ||
        !['fixed','difficulty'].includes(e.completionRewards as string)) return 'Invalid experiments';
  }
  const min = ruleset === 'simple' ? 3 : 2;
  const max = ruleset === 'simple' ? 6 : 4;
  if (!Number.isInteger(count) || count < min || count > max) return `This ruleset requires ${min}–${max} players`;
}
