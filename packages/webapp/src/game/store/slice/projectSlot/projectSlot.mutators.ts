import { PlayerID } from "boardgame.io";
import { JobName } from "../../../card";
import { findContribution } from "./projectSlot.utils";
import { ProjectSlot } from "./projectSlot";

const pushWorker = (state: ProjectSlot, jobName: JobName, playerId: PlayerID, points: number): void => {
  const contribution = findContribution(state.contributions, jobName, playerId);
  if (!contribution) {
    state.contributions.push({ jobName, worker: playerId, value: points });
  } else {
    contribution.value += points;
  }
  state.lastContributor = playerId;
};

const assignWorker = pushWorker;

const removeContributor = (state: ProjectSlot, playerId: PlayerID): void => {
  state.contributions = state.contributions.filter(contribution => contribution.worker !== playerId);
};

const assignOwner = (state: ProjectSlot, playerId: PlayerID, numWorkerTokens: number): void => {
  state.owner = playerId;
  state.ownerToken = numWorkerTokens;
};

const unassignOwner = (state: ProjectSlot): void => {
  state.owner = '';
  state.ownerToken = 0;
};

export const mutators = {
  assignWorker,
  pushWorker,
  removeContributor,
  assignOwner,
  unassignOwner,
};
