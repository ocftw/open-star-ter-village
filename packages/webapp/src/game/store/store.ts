import PlayersSlice, { Players } from "./slice/players";
import TableSlice, { Table } from "./slice/table";
import DecksSlice, { Decks } from "./slice/decks";

export interface Rule {
}

export interface GameState {
  rules: Rule;
  decks: Decks;
  table: Table;
  players: Players;
}

const initialState = (): GameState => ({
  rules: {},
  decks: DecksSlice.initialState(),
  table: TableSlice.initialState(),
  players: PlayersSlice.initialState(),
});

const GameStore = {
  initialState,
};

export default GameStore;
