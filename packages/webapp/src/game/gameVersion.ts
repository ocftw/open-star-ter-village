/**
 * Rules version stored with every persisted match (`matches.game_version`).
 * Bump it when a rules or state-shape change makes saved states unsafe to
 * resume; the server then refuses older rows instead of crashing on them.
 */
export const GAME_VERSION = '1';
