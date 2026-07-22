import { ClientGameState, GameState } from '@/game/store/store';

/** Stable reason codes for every known action-validation failure. */
export type ActionErrorCode =
  | 'ACTION_UNAVAILABLE'
  | 'ACTION_OCCUPIED'
  | 'INSUFFICIENT_ACTION_TOKENS'
  | 'INSUFFICIENT_WORKER_TOKENS'
  | 'PROJECT_CARD_NOT_IN_HAND'
  | 'JOB_CARD_NOT_ON_TABLE'
  | 'PROJECT_BOARD_FULL'
  | 'PROJECT_JOB_NOT_REQUIRED'
  | 'PROFESSION_TARGET_REQUIRED'
  | 'PROFESSION_TARGET_UNAVAILABLE'
  | 'PROJECT_SLOT_NOT_FOUND'
  | 'WORKER_ALREADY_ASSIGNED'
  | 'JOB_REQUIREMENT_FULFILLED'
  | 'PROJECT_NOT_OWNED'
  | 'PROJECT_NOT_JOINED'
  | 'NO_WORKER_ON_JOB'
  | 'CONTRIBUTION_EMPTY'
  | 'CONTRIBUTION_EXCEEDS_LIMIT'
  | 'NO_JOB_CARDS_SELECTED'
  | 'JOB_CARDS_NOT_ON_TABLE'
  | 'NO_PENDING_DISCARDS'
  | 'DISCARD_COUNT_INVALID'
  | 'OVERTIME_UNAVAILABLE'
  | 'OVERTIME_INELIGIBLE_ACTION'
  | 'OVERTIME_TARGET_NOT_USED';

export type ValidationFailure = {
  valid: false;
  reason: ActionErrorCode;
  /** Dynamic values for message interpolation, from canonical game data only. */
  details?: Record<string, string | number>;
};

export type ValidationResult = { valid: true } | ValidationFailure;

export const VALID: ValidationResult = { valid: true };

export const invalid = (
  reason: ActionErrorCode,
  details?: Record<string, string | number>,
): ValidationFailure => ({ valid: false, reason, details });

/**
 * Thrown by moves when validation fails; caught by withErrorBoundary which
 * converts it to INVALID_MOVE. Carries the structured failure for logging.
 */
export class ActionValidationError extends Error {
  failure: ValidationFailure;

  constructor(failure: ValidationFailure) {
    super(failure.reason);
    this.name = 'ActionValidationError';
    this.failure = failure;
  }
}

/**
 * Validators run on the server (full GameState) and in the client preflight
 * (ClientGameState, where only the acting player's hand is visible).
 */
export type ValidatableState = GameState | ClientGameState;

/**
 * Execution mode shared by moves, validators, and the UI. `useOvertime`
 * redeems the player's 加班 Overtime token to repeat an action whose slot is
 * already occupied this turn (base cost ≤ 1 AP; total cost is the action's
 * own AP — no surcharge).
 */
export type ActionExecutionOptions = {
  useOvertime?: boolean;
};
