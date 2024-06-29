import { PlayerID } from "boardgame.io";
import { JobName } from "../card";
import { findContribution } from "./activeProject.utils";
import { ActiveProject, ProjectContribution } from "./activeProject";

const assignWorker = (state: ActiveProject, jobName: JobName, playerId: PlayerID, points: number): void => {
  const contribution: ProjectContribution = { jobName, worker: playerId, value: points };
  state.contributions.push(contribution);
};

const pushWorker = (state: ActiveProject, jobName: JobName, playerId: PlayerID, points: number): void => {
  const contribution = findContribution(state.contributions, jobName, playerId);
  if (!contribution) {
    throw new Error(`${jobName} work played by ${playerId} not found in ${state.card.name}`);
  }
  contribution.value += points;
};

export const mutators = {
  assignWorker,
  pushWorker,
};
