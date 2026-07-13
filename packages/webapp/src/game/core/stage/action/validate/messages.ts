import { ActionErrorCode, ValidationFailure } from './types';

/**
 * Player-facing bilingual copy (zh-TW primary · English secondary) for every
 * validation reason code. Dynamic values come from canonical game
 * data via ValidationFailure.details — never from raw exception text.
 */

/** Safe fallback for unexpected rejections with no recognized reason code. */
export const GENERIC_ACTION_ERROR_MESSAGE =
  '無法完成此行動，遊戲狀態未變更。請重新確認條件。 · Action could not be completed; game state was unchanged.';

type Details = Record<string, string | number>;

const MESSAGES: Record<ActionErrorCode, (d: Details) => string> = {
  ACTION_UNAVAILABLE: () =>
    '這個行動在本局的規則下不可用。 · This action is unavailable under the current rules.',
  ACTION_OCCUPIED: () =>
    '這個行動本輪已使用。 · This action has already been used this turn.',
  INSUFFICIENT_ACTION_TOKENS: (d) =>
    `行動點不足，這個行動需要 ${d.required} 點。 · Not enough AP; this action requires ${d.required}.`,
  INSUFFICIENT_WORKER_TOKENS: (d) =>
    `工人不足，這個行動需要 ${d.required} 名工人。 · Not enough workers; this action requires ${d.required}.`,
  PROJECT_CARD_NOT_IN_HAND: () =>
    '這張專案卡已不在手牌中，請重新選擇。 · This project card is no longer in your hand; please select again.',
  JOB_CARD_NOT_ON_TABLE: () =>
    '這張人力卡已不在人力市場，請重新選擇。 · This worker card is no longer in the job market; please select again.',
  PROJECT_BOARD_FULL: () =>
    '專案區已滿，無法發起新專案。 · The project board is full.',
  PROJECT_JOB_NOT_REQUIRED: (d) =>
    `這個專案沒有「${d.jobName}」的職業位置。 · This project has no ${d.jobName} position.`,
  PROFESSION_TARGET_REQUIRED: () =>
    '這張人力卡不符合專案需求 — 請點選要指派的職業位置（斜槓青年）。 · Pick the profession position to assign this worker to (斜槓青年).',
  PROFESSION_TARGET_UNAVAILABLE: () =>
    '這個職業位置已無法使用，請重新選擇。 · This profession position is no longer available; please select again.',
  PROJECT_SLOT_NOT_FOUND: () =>
    '目標專案已經改變，請重新選擇。 · The target project changed; please select again.',
  WORKER_ALREADY_ASSIGNED: (d) =>
    `你已在這個專案指派「${d.jobName}」。 · You already assigned ${d.jobName} to this project.`,
  JOB_REQUIREMENT_FULFILLED: (d) =>
    `這個專案的「${d.jobName}」目前無法再接受這項貢獻。 · This project cannot accept more ${d.jobName} contribution.`,
  PROJECT_NOT_OWNED: () =>
    '只能貢獻給你發起的專案。 · You can only contribute to projects you own.',
  PROJECT_NOT_JOINED: () =>
    '這是你發起的專案，請改用「貢獻給你的專案」。 · This is your own project; use Contribute (own) instead.',
  NO_WORKER_ON_JOB: (d) =>
    `你在「${d.jobName}」沒有已指派的工人，無法貢獻。 · You have no worker on the ${d.jobName} position.`,
  CONTRIBUTION_EMPTY: () =>
    '尚未分配任何貢獻點。 · No contribution points allocated yet.',
  CONTRIBUTION_EXCEEDS_LIMIT: (d) =>
    `本次最多可貢獻 ${d.limit} 點。 · You may contribute at most ${d.limit} points.`,
  NO_JOB_CARDS_SELECTED: () =>
    '請先選擇要更換的人力卡。 · Select at least one worker card to replace.',
  JOB_CARDS_NOT_ON_TABLE: () =>
    '至少一張選擇的人力卡已不在市場，請重新選擇。 · A selected worker card is no longer in the market; please select again.',
  NO_PENDING_DISCARDS: () =>
    '目前不需要棄牌。 · No discards are pending.',
  DISCARD_COUNT_INVALID: (d) =>
    `必須選擇剛好 ${d.required} 張人力卡棄掉。 · Select exactly ${d.required} job cards to discard.`,
  OVERTIME_UNAVAILABLE: () =>
    '加班本輪已被使用，無法再重複行動。 · Overtime is already used this round.',
  OVERTIME_INELIGIBLE_ACTION: (d) =>
    `這個行動需要 ${d.cost} AP，加班只能重複 1 AP 的行動。 · Overtime can only repeat 1-AP actions.`,
  OVERTIME_TARGET_NOT_USED: () =>
    '加班只能重複本輪已使用過的行動。 · Overtime can only repeat an action already used this turn.',
};

export const getActionErrorMessage = (failure: ValidationFailure): string => {
  const template = MESSAGES[failure.reason];
  if (!template) return GENERIC_ACTION_ERROR_MESSAGE;
  return template(failure.details ?? {});
};
