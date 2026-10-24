// Change this one line and redeploy to stop creation of Standard rooms.
export const STANDARD_RULES_ENABLED = true;
export type Ruleset = 'simple' | 'tree-poc-v1';
export function roomSetupError(data: unknown, count: number, enabled = STANDARD_RULES_ENABLED): string | undefined {
  const ruleset = (data as { ruleset?: unknown } | undefined)?.ruleset === undefined ? 'simple' : (data as { ruleset: unknown }).ruleset;
  if (ruleset !== 'simple' && ruleset !== 'tree-poc-v1') return 'Unknown ruleset';
  if (ruleset === 'tree-poc-v1' && !enabled) return 'Standard Mode is disabled';
  const min = ruleset === 'simple' ? 3 : 2;
  const max = ruleset === 'simple' ? 6 : 4;
  if (!Number.isInteger(count) || count < min || count > max) return `This ruleset requires ${min}–${max} players`;
}
