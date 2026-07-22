/**
 * Game core logic unit tests.
 * Covers: utils, slices, moves, handlers, event card handlers.
 */

// ─── Utilities ───────────────────────────────────────────────────────────────

import { reservoirSampling } from './utils';

describe('reservoirSampling', () => {
  it('returns k items from the array', () => {
    const result = reservoirSampling([1, 2, 3, 4, 5], 3);
    expect(result).toHaveLength(3);
  });

  it('returns all items when k >= array length', () => {
    const result = reservoirSampling([1, 2, 3], 5);
    expect(result).toHaveLength(3);
  });

  it('returns empty array when k is 0', () => {
    const result = reservoirSampling([1, 2, 3], 0);
    expect(result).toHaveLength(0);
  });

  it('only returns items that exist in the original array', () => {
    const input = [10, 20, 30, 40, 50];
    const result = reservoirSampling(input, 3);
    result.forEach(item => expect(input).toContain(item));
  });
});

// ─── Rule Slice ───────────────────────────────────────────────────────────────

import RuleSlice, { RuleMutator, RuleSelector, getNumNonEndGameEventCardsByPlayerCount } from './store/slice/rule';

describe('getNumNonEndGameEventCardsByPlayerCount', () => {
  it('returns 6 for 2 players', () => {
    expect(getNumNonEndGameEventCardsByPlayerCount(2)).toBe(6);
  });
  it('returns 5 for 3 players', () => {
    expect(getNumNonEndGameEventCardsByPlayerCount(3)).toBe(5);
  });
  it('returns 4 for 4 players', () => {
    expect(getNumNonEndGameEventCardsByPlayerCount(4)).toBe(4);
  });
  it('returns 4 for 5 or more players', () => {
    expect(getNumNonEndGameEventCardsByPlayerCount(5)).toBe(4);
    expect(getNumNonEndGameEventCardsByPlayerCount(6)).toBe(4);
  });
});

describe('RuleSlice', () => {
  it('initialises with correct defaults', () => {
    const rule = RuleSlice.initialState();
    expect(rule.type).toBe('simple');
    expect(rule.player.maxActionTokens).toBe(4);
    expect(rule.player.maxWorkerTokens).toBe(12);
    expect(rule.player.maxProjectCards).toBe(2);
    expect(rule.table.maxJobSlots).toBe(8);
    expect(rule.table.maxProjectSlots).toBe(8);
    expect(rule.numNonEndGameEventCards).toBe(5);
    expect(rule.action.createProject.actionCost).toBe(2);
    expect(rule.action.recruit.actionCost).toBe(1);
    expect(rule.settlement.projectOwnerVictoryPoints).toBe(2);
    expect(rule.settlement.lastContributorVictoryPoints).toBe(2);
    expect(rule.settlement.leftoverActionTokensVictoryPoints).toBe(0);
  });

  it('setSettlementLeftoverActionTokensVictoryPoints updates correctly', () => {
    const rule = RuleSlice.initialState();
    RuleMutator.setSettlementLeftoverActionTokensVictoryPoints(rule, 1);
    expect(RuleSelector.getSettlementLeftoverActionTokensVictoryPoints(rule)).toBe(1);
    RuleMutator.setSettlementLeftoverActionTokensVictoryPoints(rule, 0);
    expect(RuleSelector.getSettlementLeftoverActionTokensVictoryPoints(rule)).toBe(0);
  });

  it('incrementContributeOwnedProjectsMaxContributionValue adds 1', () => {
    const rule = RuleSlice.initialState();
    const before = rule.action.contributeOwnedProjects.maxContributionValue;
    RuleMutator.incrementContributeOwnedProjectsMaxContributionValue(rule);
    expect(rule.action.contributeOwnedProjects.maxContributionValue).toBe(before + 1);
  });

  it('decrementContributeOwnedProjectsMaxContributionValue subtracts 1', () => {
    const rule = RuleSlice.initialState();
    RuleMutator.incrementContributeOwnedProjectsMaxContributionValue(rule);
    const before = rule.action.contributeOwnedProjects.maxContributionValue;
    RuleMutator.decrementContributeOwnedProjectsMaxContributionValue(rule);
    expect(rule.action.contributeOwnedProjects.maxContributionValue).toBe(before - 1);
  });

  it('setEventExtraOwnerVictoryPoints sets and resets', () => {
    const rule = RuleSlice.initialState();
    RuleMutator.setEventExtraOwnerVictoryPoints(rule, 2);
    expect(rule.event?.extraOwnerVictoryPoints).toBe(2);
    RuleMutator.setEventExtraOwnerVictoryPoints(rule, 0);
    expect(rule.event?.extraOwnerVictoryPoints).toBe(0);
  });

  it('setNumNonEndGameEventCards updates based on player count', () => {
    const rule = RuleSlice.initialState();
    RuleMutator.setNumNonEndGameEventCards(rule, 2);
    expect(rule.numNonEndGameEventCards).toBe(6);
    RuleMutator.setNumNonEndGameEventCards(rule, 3);
    expect(rule.numNonEndGameEventCards).toBe(5);
    RuleMutator.setNumNonEndGameEventCards(rule, 4);
    expect(rule.numNonEndGameEventCards).toBe(4);
  });

  it('setEventIgnoreFirstWorkerRequirement sets per-player flags and resets', () => {
    const rule = RuleSlice.initialState();
    RuleMutator.setEventIgnoreFirstWorkerRequirement(rule, ['alice', 'bob'], true);
    expect(rule.event?.ignoreFirstWorkerRequirement).toEqual({ alice: true, bob: true });
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(rule, 'alice')).toBe(true);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(rule, 'bob')).toBe(true);
    RuleMutator.consumeIgnoreFirstWorkerRequirement(rule, 'alice');
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(rule, 'alice')).toBe(false);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(rule, 'bob')).toBe(true);
    RuleMutator.setEventIgnoreFirstWorkerRequirement(rule, [], false);
    expect(rule.event?.ignoreFirstWorkerRequirement).toBeUndefined();
  });
});

// ─── Players Slice ────────────────────────────────────────────────────────────

import PlayersSlice, { PlayersMutator, PlayersSelector } from './store/slice/players';

describe('PlayersSlice', () => {
  const makePlayers = () => {
    const state = PlayersSlice.initialState();
    PlayersMutator.initialize(state, ['alice', 'bob']);
    PlayersMutator.resetActionTokens(state, 'alice', 4);
    PlayersMutator.resetWorkerTokens(state, 'alice', 12);
    return state;
  };

  it('initialises players with zero tokens', () => {
    const state = PlayersSlice.initialState();
    PlayersMutator.initialize(state, ['alice']);
    expect(PlayersSelector.getNumActionTokens(state, 'alice')).toBe(0);
    expect(PlayersSelector.getNumWorkerTokens(state, 'alice')).toBe(0);
  });

  it('resetActionTokens sets tokens', () => {
    const state = makePlayers();
    expect(PlayersSelector.getNumActionTokens(state, 'alice')).toBe(4);
  });

  it('useActionTokens decrements tokens', () => {
    const state = makePlayers();
    PlayersMutator.useActionTokens(state, 'alice', 2);
    expect(PlayersSelector.getNumActionTokens(state, 'alice')).toBe(2);
  });

  it('addActionTokens increments tokens', () => {
    const state = makePlayers();
    PlayersMutator.addActionTokens(state, 'alice', 1);
    expect(PlayersSelector.getNumActionTokens(state, 'alice')).toBe(5);
  });

  it('useWorkerTokens decrements tokens', () => {
    const state = makePlayers();
    PlayersMutator.useWorkerTokens(state, 'alice', 3);
    expect(PlayersSelector.getNumWorkerTokens(state, 'alice')).toBe(9);
  });

  it('addWorkerTokens increments tokens', () => {
    const state = makePlayers();
    PlayersMutator.addWorkerTokens(state, 'alice', 2);
    expect(PlayersSelector.getNumWorkerTokens(state, 'alice')).toBe(14);
  });
});

// ─── ScoreBoard Slice ─────────────────────────────────────────────────────────

import ScoreBoardSlice, { ScoreBoardMutator, ScoreBoardSelector } from './store/slice/scoreBoard';

describe('ScoreBoardSlice', () => {
  const makeBoard = () => {
    const state = ScoreBoardSlice.initialState();
    ScoreBoardMutator.initialize(state, ['alice', 'bob', 'charlie']);
    return state;
  };

  it('initialises all players with 0 points', () => {
    const state = makeBoard();
    expect(ScoreBoardSelector.getPlayerPoints(state, 'alice')).toBe(0);
    expect(ScoreBoardSelector.getPlayerPoints(state, 'bob')).toBe(0);
  });

  it('add increases player points', () => {
    const state = makeBoard();
    ScoreBoardMutator.add(state, 'alice', 5);
    expect(ScoreBoardSelector.getPlayerPoints(state, 'alice')).toBe(5);
  });

  it('getWinner returns the highest scorer', () => {
    const state = makeBoard();
    ScoreBoardMutator.add(state, 'bob', 10);
    ScoreBoardMutator.add(state, 'alice', 3);
    expect(ScoreBoardSelector.getWinner(state)).toEqual(['bob']);
  });

  it('getWinner returns all tied players when scores are equal', () => {
    const state = makeBoard();
    ScoreBoardMutator.add(state, 'alice', 7);
    ScoreBoardMutator.add(state, 'bob', 7);
    ScoreBoardMutator.add(state, 'charlie', 3);
    expect(ScoreBoardSelector.getWinner(state)).toEqual(['alice', 'bob']);
  });

  it('getAllPlayerPoints returns all scores', () => {
    const state = makeBoard();
    ScoreBoardMutator.add(state, 'alice', 2);
    ScoreBoardMutator.add(state, 'charlie', 7);
    const all = ScoreBoardSelector.getAllPlayerPoints(state);
    expect(all['alice']).toBe(2);
    expect(all['bob']).toBe(0);
    expect(all['charlie']).toBe(7);
  });
});

// ─── JobSlots Slice ───────────────────────────────────────────────────────────

import JobSlotsSlice, { JobSlotsMutator, JobSlotsSelector } from './store/slice/jobSlots';
import { JobCard } from './card';

const makeJobCard = (id: string, name: string): JobCard => ({ id, name });

describe('JobSlotsSlice', () => {
  it('addJobCards adds cards', () => {
    const state = JobSlotsSlice.initialState();
    JobSlotsMutator.addJobCards(state, [makeJobCard('1', '工程師'), makeJobCard('2', '美術設計')]);
    expect(JobSlotsSelector.getNumFilledSlots(state)).toBe(2);
  });

  it('removeJobCard removes a specific card', () => {
    const state = JobSlotsSlice.initialState();
    const card = makeJobCard('1', '工程師');
    JobSlotsMutator.addJobCards(state, [card, makeJobCard('2', '美術設計')]);
    JobSlotsMutator.removeJobCard(state, card);
    expect(JobSlotsSelector.getNumFilledSlots(state)).toBe(1);
    expect(JobSlotsSelector.getJobCardById(state, '1')).toBeUndefined();
  });

  it('removeJobCards removes multiple cards', () => {
    const state = JobSlotsSlice.initialState();
    const cards = [makeJobCard('1', '工程師'), makeJobCard('2', '美術設計'), makeJobCard('3', '議題工作者')];
    JobSlotsMutator.addJobCards(state, cards);
    JobSlotsMutator.removeJobCards(state, [cards[0], cards[2]]);
    expect(JobSlotsSelector.getNumFilledSlots(state)).toBe(1);
    expect(JobSlotsSelector.getJobCardById(state, '2')).toBeDefined();
  });
});

// ─── Event Card Handlers ──────────────────────────────────────────────────────

import { eventCardHandlers } from './core/handler/eventCardHandlers';
import GameStore from './store/store';
import DeckSlice, { DeckMutator } from './store/slice/deck';
import { ActionSlotMutator, ActionSlotSelector } from './store/slice/actionSlot';
import { removeAndRefillJobs } from './core/stage/action/move/removeAndRefillJobs';
import { createProject } from './core/stage/action/move/createProject';
import { ActionValidationError } from './core/stage/action/validate';
import { refill } from './core/handler/refill';

/** Minimal context factory for testing handlers */
const makeContext = () => {
  const G = GameStore.initialState();
  PlayersMutator.initialize(G.players, ['alice', 'bob', 'charlie']);
  PlayersMutator.resetActionTokens(G.players, 'alice', 4);
  PlayersMutator.resetActionTokens(G.players, 'bob', 4);
  PlayersMutator.resetActionTokens(G.players, 'charlie', 4);
  ScoreBoardMutator.initialize(G.table.scoreBoard, ['alice', 'bob', 'charlie']);
  return { G, events: { endGame: jest.fn() } } as any;
};

describe('eventCardHandlers - end_game_after_this_round', () => {
  it('start: sets leftoverActionTokensVictoryPoints to 1', () => {
    const ctx = makeContext();
    expect(ctx.G.rules.settlement.leftoverActionTokensVictoryPoints).toBe(0);
    eventCardHandlers.end_game_after_this_round.start(ctx);
    expect(ctx.G.rules.settlement.leftoverActionTokensVictoryPoints).toBe(1);
  });

  it('end: resets leftoverActionTokensVictoryPoints to 0 and calls endGame', () => {
    const ctx = makeContext();
    eventCardHandlers.end_game_after_this_round.start(ctx);
    eventCardHandlers.end_game_after_this_round.end!(ctx);
    expect(ctx.G.rules.settlement.leftoverActionTokensVictoryPoints).toBe(0);
    expect(ctx.events.endGame).toHaveBeenCalled();
  });
});

describe('eventCardHandlers - increase_one_owned_project_contribution_value', () => {
  it('start: increments maxContributionValue for contributeOwnedProjects', () => {
    const ctx = makeContext();
    const before = ctx.G.rules.action.contributeOwnedProjects.maxContributionValue;
    eventCardHandlers.increase_one_owned_project_contribution_value.start(ctx);
    expect(ctx.G.rules.action.contributeOwnedProjects.maxContributionValue).toBe(before + 1);
  });

  it('end: decrements maxContributionValue back', () => {
    const ctx = makeContext();
    const before = ctx.G.rules.action.contributeOwnedProjects.maxContributionValue;
    eventCardHandlers.increase_one_owned_project_contribution_value.start(ctx);
    eventCardHandlers.increase_one_owned_project_contribution_value.end!(ctx);
    expect(ctx.G.rules.action.contributeOwnedProjects.maxContributionValue).toBe(before);
  });
});

describe('eventCardHandlers - project_owner_gets_two_points', () => {
  it('start: sets extraOwnerVictoryPoints to 2', () => {
    const ctx = makeContext();
    eventCardHandlers.project_owner_gets_two_points.start(ctx);
    expect(ctx.G.rules.event?.extraOwnerVictoryPoints).toBe(2);
  });

  it('end: resets extraOwnerVictoryPoints to 0', () => {
    const ctx = makeContext();
    eventCardHandlers.project_owner_gets_two_points.start(ctx);
    eventCardHandlers.project_owner_gets_two_points.end!(ctx);
    expect(ctx.G.rules.event?.extraOwnerVictoryPoints).toBe(0);
  });
});

describe('eventCardHandlers - the_only_player_with_the_lowest_victory_points_gets_one_extra_action_token', () => {
  const handlerKey = 'the_only_player_with_the_lowest_victory_points_gets_one_extra_action_token';

  it('gives +1 action token to sole lowest scorer', () => {
    const ctx = makeContext();
    ScoreBoardMutator.add(ctx.G.table.scoreBoard, 'bob', 5);
    ScoreBoardMutator.add(ctx.G.table.scoreBoard, 'charlie', 3);
    // alice has 0 (sole lowest)
    const before = PlayersSelector.getNumActionTokens(ctx.G.players, 'alice');
    eventCardHandlers[handlerKey].start(ctx);
    expect(PlayersSelector.getNumActionTokens(ctx.G.players, 'alice')).toBe(before + 1);
  });

  it('does NOT give token when multiple players share the lowest score', () => {
    const ctx = makeContext();
    // alice and bob both at 0 (tied lowest)
    ScoreBoardMutator.add(ctx.G.table.scoreBoard, 'charlie', 5);
    const aliceBefore = PlayersSelector.getNumActionTokens(ctx.G.players, 'alice');
    const bobBefore = PlayersSelector.getNumActionTokens(ctx.G.players, 'bob');
    eventCardHandlers[handlerKey].start(ctx);
    expect(PlayersSelector.getNumActionTokens(ctx.G.players, 'alice')).toBe(aliceBefore);
    expect(PlayersSelector.getNumActionTokens(ctx.G.players, 'bob')).toBe(bobBefore);
  });
});

describe('eventCardHandlers - ignore_first_worker_requirement', () => {
  it('start: sets per-player ignoreFirstWorkerRequirement for all players', () => {
    const ctx = makeContext();
    eventCardHandlers.ignore_first_worker_requirement.start(ctx);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(ctx.G.rules, 'alice')).toBe(true);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(ctx.G.rules, 'bob')).toBe(true);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(ctx.G.rules, 'charlie')).toBe(true);
  });

  it('consuming one player does not affect others', () => {
    const ctx = makeContext();
    eventCardHandlers.ignore_first_worker_requirement.start(ctx);
    RuleMutator.consumeIgnoreFirstWorkerRequirement(ctx.G.rules, 'alice');
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(ctx.G.rules, 'alice')).toBe(false);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(ctx.G.rules, 'bob')).toBe(true);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(ctx.G.rules, 'charlie')).toBe(true);
  });

  it('end: clears ignoreFirstWorkerRequirement for all players', () => {
    const ctx = makeContext();
    eventCardHandlers.ignore_first_worker_requirement.start(ctx);
    eventCardHandlers.ignore_first_worker_requirement.end!(ctx);
    expect(ctx.G.rules.event?.ignoreFirstWorkerRequirement).toBeUndefined();
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(ctx.G.rules, 'alice')).toBe(false);
  });
});

// ─── scoreUnfinishedProjects ──────────────────────────────────────────────────

import { scoreUnfinishedProjects } from './core/handler/scoreUnfinishedProjects';
import { ProjectBoardMutator } from './store/slice/projectBoard';
import { ProjectSlotMutator } from './store/slice/projectSlot/projectSlot';
import { ProjectCard } from './card';

const makeProjectCard = (id: string, requirements: Record<string, number>): ProjectCard =>
  ({ id, name: id, type: 'open_source', difficulty: 1, requirements } as unknown as ProjectCard);

describe('scoreUnfinishedProjects', () => {
  const makeCtx = () => {
    const G = GameStore.initialState();
    PlayersMutator.initialize(G.players, ['alice', 'bob', 'charlie']);
    ScoreBoardMutator.initialize(G.table.scoreBoard, ['alice', 'bob', 'charlie']);
    ProjectBoardMutator.initialize(G.table.projectBoard, 4);
    return { G, events: { endGame: jest.fn() } } as any;
  };

  it('does nothing when no unfinished projects', () => {
    const ctx = makeCtx();
    scoreUnfinishedProjects(ctx);
    expect(ScoreBoardSelector.getPlayerPoints(ctx.G.table.scoreBoard, 'alice')).toBe(0);
  });

  it('scores floor(contributionPoints / 2) VP per player', () => {
    const ctx = makeCtx();
    // requirement is 12 so project stays unfinished (alice 4 + bob 3 = 7 < 12)
    const card = makeProjectCard('p1', { Engineer: 12 });
    ProjectBoardMutator.add(ctx.G.table.projectBoard, card);
    const slot = ctx.G.table.projectBoard[0];
    // alice contributes 4 pts → 2 VP; bob contributes 3 pts → 1 VP
    ProjectSlotMutator.pushWorker(slot, 'Engineer', 'alice', 4);
    ProjectSlotMutator.pushWorker(slot, 'Engineer', 'bob', 3);

    scoreUnfinishedProjects(ctx);

    expect(ScoreBoardSelector.getPlayerPoints(ctx.G.table.scoreBoard, 'alice')).toBe(2);
    expect(ScoreBoardSelector.getPlayerPoints(ctx.G.table.scoreBoard, 'bob')).toBe(1);
  });

  it('discards remainder (1 contribution point = 0 VP)', () => {
    const ctx = makeCtx();
    const card = makeProjectCard('p2', { Advocator: 3 });
    ProjectBoardMutator.add(ctx.G.table.projectBoard, card);
    const slot = ctx.G.table.projectBoard[0];
    ProjectSlotMutator.pushWorker(slot, 'Advocator', 'charlie', 1);

    scoreUnfinishedProjects(ctx);

    expect(ScoreBoardSelector.getPlayerPoints(ctx.G.table.scoreBoard, 'charlie')).toBe(0);
  });

  it('accumulates points across multiple unfinished projects', () => {
    const ctx = makeCtx();
    const card1 = makeProjectCard('p3', { Engineer: 5 });
    const card2 = makeProjectCard('p4', { Advocator: 5 });
    ProjectBoardMutator.add(ctx.G.table.projectBoard, card1);
    ProjectBoardMutator.add(ctx.G.table.projectBoard, card2);
    const slot1 = ctx.G.table.projectBoard[0];
    const slot2 = ctx.G.table.projectBoard[1];
    // alice has 3 pts on project1 and 1 pt on project2 = 4 total → 2 VP
    ProjectSlotMutator.pushWorker(slot1, 'Engineer', 'alice', 3);
    ProjectSlotMutator.pushWorker(slot2, 'Advocator', 'alice', 1);

    scoreUnfinishedProjects(ctx);

    expect(ScoreBoardSelector.getPlayerPoints(ctx.G.table.scoreBoard, 'alice')).toBe(2);
  });
});

describe('eventCardHandlers - discard_and_refill_all_worker_slots', () => {
  it('discards all job cards and refills to maxJobSlots', () => {
    const ctx = makeContext();
    // seed the deck with 20 job cards
    const deckCards = Array.from({ length: 20 }, (_, i) => makeJobCard(`deck-${i}`, '工程師'));
    DeckMutator.initialize(ctx.G.decks.jobs, deckCards);
    // put 3 cards on the table
    const tableCards = [makeJobCard('t1', '美術設計'), makeJobCard('t2', '議題工作者'), makeJobCard('t3', '工程師')];
    JobSlotsMutator.addJobCards(ctx.G.table.jobSlots, tableCards);
    expect(JobSlotsSelector.getNumFilledSlots(ctx.G.table.jobSlots)).toBe(3);

    eventCardHandlers.discard_and_refill_all_worker_slots.start(ctx);

    const maxSlots = RuleSelector.getTableMaxJobSlots(ctx.G.rules); // 8
    expect(JobSlotsSelector.getNumFilledSlots(ctx.G.table.jobSlots)).toBe(maxSlots);
    // old table cards should be gone
    tableCards.forEach(c => {
      expect(JobSlotsSelector.getJobCardById(ctx.G.table.jobSlots, c.id)).toBeUndefined();
    });
  });
});

describe('四大自由 — add_two_worker_slots', () => {
  it('start: adds 2 cards from deck and increases maxJobSlots to 10', () => {
    const ctx = makeContext();
    const deckCards = Array.from({ length: 10 }, (_, i) => makeJobCard(`deck-${i}`, '工程師'));
    DeckMutator.initialize(ctx.G.decks.jobs, deckCards);
    const tableCards = [makeJobCard('t1', '美術設計'), makeJobCard('t2', '議題工作者')];
    JobSlotsMutator.addJobCards(ctx.G.table.jobSlots, tableCards);
    expect(JobSlotsSelector.getNumFilledSlots(ctx.G.table.jobSlots)).toBe(2);

    eventCardHandlers.add_two_worker_slots.start(ctx);

    expect(RuleSelector.getTableMaxJobSlots(ctx.G.rules)).toBe(10);
    expect(JobSlotsSelector.getNumFilledSlots(ctx.G.table.jobSlots)).toBe(4);
  });

  it('end: removes last 2 cards and restores maxJobSlots', () => {
    const ctx = makeContext();
    const deckCards = Array.from({ length: 10 }, (_, i) => makeJobCard(`deck-${i}`, '工程師'));
    DeckMutator.initialize(ctx.G.decks.jobs, deckCards);
    const tableCards = Array.from({ length: 8 }, (_, i) => makeJobCard(`t${i}`, '美術設計'));
    JobSlotsMutator.addJobCards(ctx.G.table.jobSlots, tableCards);

    // simulate start having already run
    eventCardHandlers.add_two_worker_slots.start(ctx);
    expect(JobSlotsSelector.getNumFilledSlots(ctx.G.table.jobSlots)).toBe(10);

    const addedCards = ctx.G.table.jobSlots.slice(8); // the 2 cards added by start
    eventCardHandlers.add_two_worker_slots.end!(ctx);

    expect(RuleSelector.getTableMaxJobSlots(ctx.G.rules)).toBe(8);
    expect(JobSlotsSelector.getNumFilledSlots(ctx.G.table.jobSlots)).toBe(8);
    // the 2 added cards should be gone
    addedCards.forEach((c: { id: string }) => {
      expect(JobSlotsSelector.getJobCardById(ctx.G.table.jobSlots, c.id)).toBeUndefined();
    });
  });
});

// ─── 加班 Overtime token (redeemed inside regular moves) ──────────────────────

describe('加班 Overtime token — regular moves with { useOvertime }', () => {
  // Helper: context with a playerID, the overtime token granted, and a
  // 1-AP action (removeAndRefillJobs) already used this turn.
  const makeOvertimeContext = () => {
    const ctx = makeContext();
    PlayersMutator.resetOvertimeTokens(ctx.G.players, 'alice', 1);
    const jobCard = makeJobCard('j1', '工程師');
    JobSlotsMutator.addJobCards(ctx.G.table.jobSlots, [jobCard]);
    DeckMutator.initialize(ctx.G.decks.jobs, [makeJobCard('d1', '美術設計')]);
    return { ...ctx, playerID: 'alice' };
  };
  const occupyTarget = (ctx: ReturnType<typeof makeOvertimeContext>) => {
    // Simulate removeAndRefillJobs was already done this turn (slot + 1 AP).
    ActionSlotMutator.occupy(ctx.G.table.actionSlots.removeAndRefillJobs);
    PlayersMutator.useActionTokens(ctx.G.players, 'alice', 1);
  };

  it('repeats an occupied 1-AP action for only that action\'s AP and consumes the token', () => {
    const ctx = makeOvertimeContext();
    occupyTarget(ctx);

    const apBefore = PlayersSelector.getNumActionTokens(ctx.G.players, 'alice');
    removeAndRefillJobs(ctx, ['j1'], { useOvertime: true });

    // Total cost is the action's own 1 AP — no surcharge.
    expect(PlayersSelector.getNumActionTokens(ctx.G.players, 'alice')).toBe(apBefore - 1);
    expect(PlayersSelector.getNumOvertimeTokens(ctx.G.players, 'alice')).toBe(0);
    // The target slot stays occupied; j1 was removed by the repeated action.
    expect(ActionSlotSelector.isOccupied(ctx.G.table.actionSlots.removeAndRefillJobs)).toBe(true);
    expect(JobSlotsSelector.getJobCardById(ctx.G.table.jobSlots, 'j1')).toBeUndefined();
  });

  it('executes normally without consuming the token when the slot is free', () => {
    const ctx = makeOvertimeContext();
    removeAndRefillJobs(ctx, ['j1'], { useOvertime: true });
    expect(PlayersSelector.getNumOvertimeTokens(ctx.G.players, 'alice')).toBe(1);
    expect(ActionSlotSelector.isOccupied(ctx.G.table.actionSlots.removeAndRefillJobs)).toBe(true);
  });

  it('normal repeat of an occupied action still fails (ACTION_OCCUPIED)', () => {
    const ctx = makeOvertimeContext();
    occupyTarget(ctx);
    expect(() => removeAndRefillJobs(ctx, ['j1'])).toThrow(ActionValidationError);
    expect(PlayersSelector.getNumOvertimeTokens(ctx.G.players, 'alice')).toBe(1);
  });

  it('rejects a 2-AP action (createProject) even with the token', () => {
    const ctx = makeOvertimeContext();
    ActionSlotMutator.occupy(ctx.G.table.actionSlots.createProject);
    expect(() => createProject(ctx, 'cardId', 'jobId', undefined, { useOvertime: true }))
      .toThrow(ActionValidationError);
  });

  it('rejects redemption once the token is spent, leaving state untouched', () => {
    const ctx = makeOvertimeContext();
    occupyTarget(ctx);
    PlayersMutator.resetOvertimeTokens(ctx.G.players, 'alice', 0);
    const apBefore = PlayersSelector.getNumActionTokens(ctx.G.players, 'alice');
    expect(() => removeAndRefillJobs(ctx, ['j1'], { useOvertime: true })).toThrow(ActionValidationError);
    expect(PlayersSelector.getNumActionTokens(ctx.G.players, 'alice')).toBe(apBefore);
    expect(JobSlotsSelector.getJobCardById(ctx.G.table.jobSlots, 'j1')).toBeDefined();
  });

  it('failed validation never consumes the token (atomicity)', () => {
    const ctx = makeOvertimeContext();
    occupyTarget(ctx);
    // Empty selection: NO_JOB_CARDS_SELECTED — thrown before any mutation.
    expect(() => removeAndRefillJobs(ctx, [], { useOvertime: true })).toThrow(ActionValidationError);
    expect(PlayersSelector.getNumOvertimeTokens(ctx.G.players, 'alice')).toBe(1);
  });

  it('only one redemption per turn: a second overtime attempt fails', () => {
    const ctx = makeOvertimeContext();
    occupyTarget(ctx);
    removeAndRefillJobs(ctx, ['j1'], { useOvertime: true });
    expect(PlayersSelector.getNumOvertimeTokens(ctx.G.players, 'alice')).toBe(0);
    // The slot is occupied and the token is gone — the next overtime
    // attempt must be rejected before its own selection is even examined.
    expect(() => removeAndRefillJobs(ctx, ['d1'], { useOvertime: true })).toThrow(ActionValidationError);
  });

  it('refill at turn end restores the overtime token with the action tokens', () => {
    const ctx = makeOvertimeContext();
    occupyTarget(ctx);
    removeAndRefillJobs(ctx, ['j1'], { useOvertime: true });
    expect(PlayersSelector.getNumOvertimeTokens(ctx.G.players, 'alice')).toBe(0);

    refill({ ...ctx, ctx: { currentPlayer: 'alice' } } as never);
    expect(PlayersSelector.getNumOvertimeTokens(ctx.G.players, 'alice')).toBe(1);
    expect(PlayersSelector.getNumActionTokens(ctx.G.players, 'alice')).toBe(4);
    expect(ActionSlotSelector.isOccupied(ctx.G.table.actionSlots.removeAndRefillJobs)).toBe(false);
  });
});
