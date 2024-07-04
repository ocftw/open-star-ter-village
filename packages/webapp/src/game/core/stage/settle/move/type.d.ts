import { SettleProjects } from "./settleProjects";

export interface SettleMoves {
  settleProjects: SettleProjects;
}
export type SettleMoveNames = keyof SettleMoves;
