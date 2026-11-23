import { Ctx, PlayerID } from "boardgame.io";
import { ClientGameState, GameState } from "../store/store";
import { ClientPlayers } from "../store/slice/players";
import { getSlashWildJobCardOwner, isSlashWildJobCard } from "./slashWildJob";

export const playerView = ({ G, playerID }: { G: GameState; ctx: Ctx; playerID: PlayerID | null }): ClientGameState => {
  const { decks, players, ...view } = G;
  const publicPlayers: ClientPlayers = {};
  for (let id in players) {
    if (id === playerID) {
      publicPlayers[id] = players[id];
    } else {
      // hide hand from the other players and observers
      const { hand, ...player } = players[id];
      publicPlayers[id] = player;
    }
  }

  // 斜槓青年: only the entitled player sees their synthetic wild job card.
  const table = view.table.jobSlots.some(isSlashWildJobCard)
    ? {
      ...view.table,
      jobSlots: view.table.jobSlots.filter(
        (card) => !isSlashWildJobCard(card) || getSlashWildJobCardOwner(card) === playerID,
      ),
    }
    : view.table;

  return {
    ...view,
    table,
    players: publicPlayers,
  };
}
