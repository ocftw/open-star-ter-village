import { Ctx, PlayerID } from "boardgame.io";
import { Player } from "../store/slice/players";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type PlayerViewFn<G extends any = any> = (context: {
  G: G;
  ctx: Ctx;
  playerID: PlayerID | null;
}) => any;

export const playerView: PlayerViewFn = ({ G, playerID}) => {
  const { decks, players, ...view } = G;
  const publicPlayers: Record<PlayerID, PartialBy<Player, 'hand'>> = {};
  for (let id in players) {
    if (id === playerID) {
      publicPlayers[id] = players[id];
    } else {
      // hide hand from the other players and observers
      const { hand, ...player } = players[id];
      publicPlayers[id] = player;
    }
  }

  return {
    ...view,
    players: publicPlayers,
  };
}
