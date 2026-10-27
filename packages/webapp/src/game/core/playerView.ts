import { Ctx, PlayerID } from "boardgame.io";
import { ClientGameState, GameState } from "../store/store";
import { ClientPlayers } from "../store/slice/players";

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

  // Telemetry is balance data for bots and debug mode only; players never receive it.
  const standard = view.standard && { ...view.standard };
  if (standard) delete standard.telemetry;

  return {
    ...view,
    ...(standard ? { standard } : {}),
    players: publicPlayers,
  };
}
