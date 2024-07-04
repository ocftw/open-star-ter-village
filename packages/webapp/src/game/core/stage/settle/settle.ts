import { GameStageConfig } from "@/game/core/type";
import { settleProjects } from "./move/settleProjects";

export const settle: GameStageConfig = {
  moves: {
    settleProjects: {
      client: false,
      // client trigger settle project and move on to next stage
      move: settleProjects,
    },
  },
  next: 'refill',
};
