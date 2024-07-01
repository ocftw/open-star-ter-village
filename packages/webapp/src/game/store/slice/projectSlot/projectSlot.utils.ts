import { PlayerID } from "boardgame.io";
import { JobName } from "../card";
import { ProjectContribution } from "./projectSlot";

export const findContribution = (contributions: ProjectContribution[], jobName: JobName, playerId: PlayerID) => contributions.find(contribution => contribution.jobName === jobName && contribution.worker === playerId);
