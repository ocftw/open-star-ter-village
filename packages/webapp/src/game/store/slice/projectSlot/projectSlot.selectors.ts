import { PlayerID } from "boardgame.io";
import { findContribution } from "./projectSlot.utils";
import { ProjectSlot } from "./projectSlot";
import { JobName } from "../../../card";

const hasWorker = (state: ProjectSlot, jobName: JobName, playerId: PlayerID): boolean => {
  const contribution = findContribution(state.contributions, jobName, playerId);
  return contribution !== undefined;
}

const getWorkerContribution = (state: ProjectSlot, jobName: JobName, playerId: PlayerID): number => {
  const contribution = findContribution(state.contributions, jobName, playerId);
  return contribution?.value ?? 0;
}

const getJobContribution = (state: ProjectSlot, jobName: JobName): number => {
  const jobContribution = state.contributions
    .filter(contribution => contribution.jobName === jobName)
    .map(contribution => contribution.value)
    .reduce((a, b) => a + b, 0);
  return jobContribution;
}

const getPlayerContribution = (state: ProjectSlot, playerId: PlayerID): number => {
  const playerContribution = state.contributions
    .filter(contribution => contribution.worker === playerId)
    .map(contribution => contribution.value)
    .reduce((a, b) => a + b, 0);
  return playerContribution;
}

const getPlayerWorkerTokens = (state: ProjectSlot, playerId: PlayerID): number => {
  const jobTokens = state.contributions
    .filter(contribution => contribution.worker === playerId)
    .length;
  return jobTokens;
}

const getContributors = (state: ProjectSlot): PlayerID[] => {
  const contributors = state.contributions.map(contribution => contribution.worker);
  const uniqueContributors = Array.from(new Set(contributors));
  return uniqueContributors;
};

const getOwner = (state: ProjectSlot): { owner: PlayerID, numWorkerToken: number } => {
  return { owner: state.owner, numWorkerToken: state.ownerToken };
};

export const selectors = {
  hasWorker,
  getWorkerContribution,
  getJobContribution,
  getPlayerContribution,
  getPlayerWorkerTokens,
  getContributors,
  getOwner,
};
