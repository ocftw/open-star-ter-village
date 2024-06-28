import { FnContext, PlayerID } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { Deck } from '../decks/deck';
import { Cards } from '../cards/cards';
import { isInRange } from '../utils';
import { ActiveProject, ActiveProjects } from '../table/activeProjects';
import { JobName } from '../cards/card';
import { GameState } from '../game';

export type AllMoves = ActionMoves & StageMoves;

export interface ActionMoves {
  createProject: CreateProject;
  recruit: Recruit;
  contributeOwnedProjects: ContributeOwnedProjects;
  contributeJoinedProjects: ContributeJoinedProjects;
  removeAndRefillJobs: RemoveAndRefillJobs;
  mirror: Mirror;
};

export interface StageMoves {
  settle: Settle;
  refillAndEnd: RefillAndEnd;
};

export type Contribution = { jobName: JobName; value: number }
export interface ContributionAction extends Contribution {
  activeProjectIndex: number;
}

export type CreateProject = (projectCardIndex: number, jobCardIndex: number) => void;
export type Recruit = (resourceCardIndex: number, activeProjectIndex: number) => void;
export type ContributeOwnedProjects = (contributions: ContributionAction[]) => void;
export type ContributeJoinedProjects = (contributions: ContributionAction[]) => void;
export type RemoveAndRefillJobs = (jobCardIndices: number[]) => void;
export type Mirror = (actionName: keyof ActionMoves, ...params: any[]) => void;
export type Settle = () => void;
export type RefillAndEnd = () => void;
export type RefillProject = () => void;
export type RefillForce = () => void;

// Define the type of a move to support type checking
export type GameMove<Fn extends (...params: any[]) => void> = (context: FnContext<GameState> & { playerID: PlayerID }, ...args: Parameters<Fn>) => void | GameState | typeof INVALID_MOVE;

export const createProject: GameMove<CreateProject> = ({ G, playerID }, projectCardIndex: number, jobCardIndex: number) => {
  if (!G.table.activeActionMoves.createProject) {
    return INVALID_MOVE;
  }

  const currentPlayer = playerID!;
  const currentPlayerToken = G.players[currentPlayer].token;
  // TODO: replace hardcoded number with dynamic rules
  const createProjectActionCosts = 2;
  if (currentPlayerToken.actions < createProjectActionCosts) {
    return INVALID_MOVE;
  }
  const createProjectWorkerCosts = 1;
  if (currentPlayerToken.workers < createProjectWorkerCosts) {
    return INVALID_MOVE;
  }

  // check project card in in hand
  const currentHandProjects = G.players[currentPlayer].hand.projects;
  if (!isInRange(projectCardIndex, currentHandProjects.length)) {
    return INVALID_MOVE;
  }

  // check job card is on the table
  const currentJobs = G.table.activeJobs;
  if (!isInRange(jobCardIndex, currentJobs.length)) {
    return INVALID_MOVE;
  }

  // check job card is required in project
  const projectCard = Cards.GetById(currentHandProjects, projectCardIndex);
  const jobCard = Cards.GetById(currentJobs, jobCardIndex);
  if (!Object.keys(projectCard.requirements).includes(jobCard.name)) {
    return INVALID_MOVE;
  }

  // reduce action tokens
  currentPlayerToken.actions -= createProjectActionCosts;
  Cards.RemoveOne(currentHandProjects, projectCard);
  Cards.RemoveOne(currentJobs, jobCard);

  // initial active project
  const activeProjectIndex = ActiveProjects.Add(G.table.activeProjects, projectCard, currentPlayer);
  const activeProject = ActiveProjects.GetById(G.table.activeProjects, activeProjectIndex);

  // reduce worker token
  currentPlayerToken.workers -= createProjectWorkerCosts;
  // assign worker token
  const jobInitPoints = 1;
  ActiveProject.AssignWorker(activeProject, jobCard.name, currentPlayer, jobInitPoints);
  // score victory points
  const createProjectVictoryPoints = 1;
  G.players[currentPlayer].victoryPoints += createProjectVictoryPoints;

  // discard job card
  Deck.Discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobCards = 5;
  const refillCardNumber = maxJobCards - currentJobs.length;
  const jobCards = Deck.Draw(G.decks.jobs, refillCardNumber);
  Cards.Add(currentJobs, jobCards);

  G.table.activeActionMoves.createProject = false;
}

export const recruit: GameMove<Recruit> = ({ G, playerID }, jobCardIndex: number, activeProjectIndex: number) => {
  if (!G.table.activeActionMoves.recruit) {
    return INVALID_MOVE;
  }

  const currentPlayer = playerID!;
  const currentPlayerToken = G.players[currentPlayer].token;
  const recruitActionCosts = 1;
  if (currentPlayerToken.actions < recruitActionCosts) {
    return INVALID_MOVE;
  }
  const recruitWorkerCosts = 1;
  if (currentPlayerToken.workers < recruitWorkerCosts) {
    return INVALID_MOVE;
  }

  const currentJobs = G.table.activeJobs;
  if (!isInRange(jobCardIndex, currentJobs.length)) {
    return INVALID_MOVE;
  }

  const activeProjects = G.table.activeProjects
  if (!isInRange(activeProjectIndex, activeProjects.length)) {
    return INVALID_MOVE;
  }
  const jobCard = Cards.GetById(currentJobs, jobCardIndex);
  const activeProject = ActiveProjects.GetById(G.table.activeProjects, activeProjectIndex);
  const jobContribution = ActiveProject.GetJobContribution(activeProject, jobCard.name);
  // Check job requirment is not fulfilled yet
  if (!(jobContribution < activeProject.card.requirements[jobCard.name])) {
    return INVALID_MOVE;
  }
  // User cannot place more than one worker in same job
  if (ActiveProject.HasWorker(activeProject, jobCard.name, currentPlayer)) {
    return INVALID_MOVE;
  }

  // reduce action
  currentPlayerToken.actions -= recruitActionCosts;
  Cards.RemoveOne(currentJobs, jobCard);

  // reduce worker tokens
  currentPlayerToken.workers -= recruitWorkerCosts;
  // assign worker token
  const jobInitPoints = 1;
  ActiveProject.AssignWorker(activeProject, jobCard.name, currentPlayer, jobInitPoints);

  // discard job card
  Deck.Discard(G.decks.jobs, [jobCard]);

  // Refill job card
  const maxJobCards = 5;
  const refillCardNumber = maxJobCards - currentJobs.length;
  const jobCards = Deck.Draw(G.decks.jobs, refillCardNumber);
  Cards.Add(currentJobs, jobCards);

  G.table.activeActionMoves.recruit = false;
};

export const contributeOwnedProjects: GameMove<ContributeOwnedProjects> = ({ G, playerID }, contributions: ContributionAction[]) => {
  if (!G.table.activeActionMoves.contributeOwnedProjects) {
    return INVALID_MOVE;
  }

  const currentPlayer = playerID!;
  const currentPlayerToken = G.players[currentPlayer].token;
  const contributeActionCosts = 1;
  if (currentPlayerToken.actions < contributeActionCosts) {
    return INVALID_MOVE;
  }
  const activeProjects = G.table.activeProjects
  const isInvalid = contributions.map(({ activeProjectIndex, jobName }) => {
    if (!isInRange(activeProjectIndex, activeProjects.length)) {
      return true;
    }
    const activeProject = ActiveProjects.GetById(activeProjects, activeProjectIndex);
    if (activeProject.owner !== currentPlayer) {
      return true;
    }

    if (!ActiveProject.HasWorker(activeProject, jobName, currentPlayer)) {
      return true;
    }
  }).some(x => x);
  if (isInvalid) {
    return INVALID_MOVE;
  }
  const totalContributions = contributions.map(({ value }) => value).reduce((a, b) => a + b, 0);
  const maxOwnedContributions = 4;
  if (!(totalContributions <= maxOwnedContributions)) {
    return INVALID_MOVE;
  }

  // deduct action tokens
  currentPlayerToken.actions -= contributeActionCosts;
  contributions.forEach(({ activeProjectIndex, jobName, value }) => {
    // update contributions to given contribution points
    const activeProject = ActiveProjects.GetById(G.table.activeProjects, activeProjectIndex);
    ActiveProject.PushWorker(activeProject, jobName, currentPlayer, value);
  });

  G.table.activeActionMoves.contributeOwnedProjects = false;
};

export const contributeJoinedProjects: GameMove<ContributeJoinedProjects> = ({G, ctx, playerID}, contributions: ContributionAction[]) => {
  if (!G.table.activeActionMoves.contributeJoinedProjects) {
    return INVALID_MOVE;
  }

  const currentPlayer = playerID!;
  const currentPlayerToken = G.players[currentPlayer].token;
  const contributeActionCosts = 1;
  if (currentPlayerToken.actions < contributeActionCosts) {
    return INVALID_MOVE;
  }
  const activeProjects = G.table.activeProjects
  const isInvalid = contributions.map(({ activeProjectIndex, jobName }) => {
    if (!isInRange(activeProjectIndex, activeProjects.length)) {
      return true;
    }
    const activeProject = ActiveProjects.GetById(activeProjects, activeProjectIndex);
    if (activeProject.owner === currentPlayer) {
      return true;
    }

    if (!ActiveProject.HasWorker(activeProject, jobName, currentPlayer)) {
      return true;
    }
  }).some(x => x);
  if (isInvalid) {
    return INVALID_MOVE;
  }
  const totalContributions = contributions.map(({ value }) => value).reduce((a, b) => a + b, 0);
  const maxJoinedContributions = 3;
  if (!(totalContributions <= maxJoinedContributions)) {
    return INVALID_MOVE;
  }

  // deduct action tokens
  currentPlayerToken.actions -= contributeActionCosts;
  contributions.forEach(({ activeProjectIndex, jobName, value }) => {
    // update contributions to given contribution points
    const activeProject = ActiveProjects.GetById(G.table.activeProjects, activeProjectIndex);
    ActiveProject.PushWorker(activeProject, jobName, currentPlayer, value);
  });

  G.table.activeActionMoves.contributeJoinedProjects = false;
};

export const removeAndRefillJobs: GameMove<RemoveAndRefillJobs> = ({ G }, jobCardIndices: number[]) => {
  if (!G.table.activeActionMoves.removeAndRefillJobs) {
    return INVALID_MOVE;
  }

  const currentJob = G.table.activeJobs;
  const jobDeck = G.decks.jobs;
  const isInvalid = jobCardIndices.map(index => !isInRange(index, currentJob.length)).some(x => x);
  if (isInvalid) {
    return INVALID_MOVE;
  }
  const removedJobCards = jobCardIndices.map(index => currentJob[index]);
  Cards.Remove(currentJob, removedJobCards);
  Deck.Discard(jobDeck, removedJobCards);

  const maxJobCards = 5;
  const refillCardNumber = maxJobCards - currentJob.length;
  const jobCards = Deck.Draw(jobDeck, refillCardNumber);
  Cards.Add(currentJob, jobCards);

  G.table.activeActionMoves.removeAndRefillJobs = false;
};

export const mirror: GameMove<Mirror> = (context, actionName, ...params) => {
  const { G } = context;
  if (!G.table.activeActionMoves.mirror) {
    return INVALID_MOVE;
  }

  // TODO: add token to bypass the active moves check when its inactive

  let result = null;
  switch (actionName) {
    case 'createProject':
      result = createProject(context, ...(params as Parameters<CreateProject>));
      break;
    case 'recruit':
      result = recruit(context, ...(params as Parameters<Recruit>));
      break;
    case 'contributeOwnedProjects':
      result = contributeOwnedProjects(context, ...(params as Parameters<ContributeOwnedProjects>));
      break;
    case 'contributeJoinedProjects':
      result = contributeJoinedProjects(context, ...(params as Parameters<ContributeJoinedProjects>));
      break;
    case 'removeAndRefillJobs':
      result = removeAndRefillJobs(context, ...(params as Parameters<RemoveAndRefillJobs>));
      break;
    default:
      result = INVALID_MOVE;
      break;
  }

  // TODO: remove the token

  if (result === INVALID_MOVE) {
    return INVALID_MOVE;
  }

  G.table.activeActionMoves.mirror = false;
};
