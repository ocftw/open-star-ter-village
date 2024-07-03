import { PlayerID } from "boardgame.io";
import { JobName } from "../../../card";
import { findContribution } from "./projectSlot.utils";
import { ProjectSlot, ProjectContribution } from "./projectSlot";

const assignWorker = (state: ProjectSlot, jobName: JobName, playerId: PlayerID, points: number): void => {
  const contribution: ProjectContribution = { jobName, worker: playerId, value: points };
  state.contributions.push(contribution);
  state.lastContributor = playerId;
};

const pushWorker = (state: ProjectSlot, jobName: JobName, playerId: PlayerID, points: number): void => {
  const contribution = findContribution(state.contributions, jobName, playerId);
  if (!contribution) {
    throw new Error(`${jobName} work played by ${playerId} not found in ${state.card.name}`);
  }
  contribution.value += points;
  state.lastContributor = playerId;
};

export const mutators = {
  assignWorker,
  pushWorker,
};
