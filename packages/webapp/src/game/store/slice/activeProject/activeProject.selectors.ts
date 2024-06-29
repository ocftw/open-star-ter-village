import { PlayerID } from "boardgame.io";
import { findContribution } from "./activeProject.utils";
import { ActiveProject } from "./activeProject";
import { JobName } from "@/game/store/slice/card";

const hasWorker = (state: ActiveProject, jobName: JobName, playerId: PlayerID): boolean => {
  const contribution = findContribution(state.contributions, jobName, playerId);
  return contribution !== undefined;
}

const getWorkerContribution = (state: ActiveProject, jobName: JobName, playerId: PlayerID): number => {
  const contribution = findContribution(state.contributions, jobName, playerId);
  return contribution?.value ?? 0;
}

const getJobContribution = (state: ActiveProject, jobName: JobName): number => {
  const jobContribution = state.contributions
    .filter(contribution => contribution.jobName === jobName)
    .map(contribution => contribution.value)
    .reduce((a, b) => a + b, 0);
  return jobContribution;
}

const getPlayerContribution = (state: ActiveProject, playerId: PlayerID): number => {
  const playerContribution = state.contributions
    .filter(contribution => contribution.worker === playerId)
    .map(contribution => contribution.value)
    .reduce((a, b) => a + b, 0);
  return playerContribution;
}

const getPlayerWorkerTokens = (state: ActiveProject, playerId: PlayerID): number => {
  const ownerToken = state.owner === playerId ? 1 : 0;
  const jobTokens = state.contributions
    .filter(contribution => contribution.worker === playerId)
    .length;
  return ownerToken + jobTokens;
}

export const selectors = {
  hasWorker,
  getWorkerContribution,
  getJobContribution,
  getPlayerContribution,
  getPlayerWorkerTokens,
};
