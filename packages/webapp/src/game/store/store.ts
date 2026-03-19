import PlayersSlice, { Player, Players } from "./slice/players";
import TableSlice, { Table } from "./slice/table";
import DecksSlice, { Decks } from "./slice/decks";
import RuleSlice, { Rule } from "./slice/rule";
import { PlayerID } from "boardgame.io";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** The game state as seen by a client (after playerView strips server-only data). */
export type ClientGameState = Omit<GameState, 'decks'> & {
  players: Record<PlayerID, PartialBy<Player, 'hand'>>;
};

export interface GameState {
  rules: Rule;
  decks: Decks;
  table: Table;
  players: Players;
  /**
   * The current play order, stored in G so it can be rotated safely.
   * boardgame.io's ctx.playOrder is read-only in hooks; mutations to it are
   * silently ignored. We store the desired order here and use
   * TurnOrder.CUSTOM_FROM('playOrder') so boardgame.io picks it up at the
   * start of each turn.
   */
  playOrder: PlayerID[];
}

const initialState = (): GameState => ({
  rules: RuleSlice.initialState(),
  decks: DecksSlice.initialState(),
  table: TableSlice.initialState(),
  players: PlayersSlice.initialState(),
  playOrder: [],
});

const GameStore = {
  initialState,
};

export default GameStore;
