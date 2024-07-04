import { GameStageConfig } from "@/game/core/type";
import { refillAndEnd } from "./move/refillAndEnd";

export const refill: GameStageConfig = {
  moves: {
    refillAndEnd: {
      client: false,
      move: refillAndEnd,
    },
  },
}
