/**
 * 斜槓青年 per-turn wild job card (marked games) and the legacy semantics
 * kept for unmarked in-flight games.
 */
import { Client } from 'boardgame.io/client';
import type { Ctx, Game } from 'boardgame.io';
import GameStore, { GameState } from '@/game/store/store';
import { OpenStarTerVillage } from '@/game/game';
import { setup } from '@/game/core/setup';
import { playerView } from '@/game/core/playerView';
import { PlayersMutator } from '@/game/store/slice/players';
import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';
import { RuleMutator, RuleSelector } from '@/game/store/slice/rule';
import { DeckMutator } from '@/game/store/slice/deck';
import { eventCardHandlers } from '@/game/core/handler/eventCardHandlers';
import { createProject } from '@/game/core/stage/action/move/createProject';
import { recruit } from '@/game/core/stage/action/move/recruit';
import { removeAndRefillJobs } from '@/game/core/stage/action/move/removeAndRefillJobs';
import { discardExcessJobCards } from '@/game/core/stage/action/move/discardExcessJobCards';
import {
  getActionErrorMessage,
  validateCreateProject,
  validateDiscardExcessJobCards,
  validateRecruit,
  validateRemoveAndRefillJobs,
  ValidationResult,
} from '@/game/core/stage/action/validate';
import { EventCard, JobCard, ProjectCard } from '@/game/card';
import {
  SLASH_WILD_JOB_NAME,
  getNumRealJobSlots,
  getRealJobCards,
  getSlashWildJobCardId,
  getSlashWildJobCardOwner,
  isSlashWildJobCard,
  offerSlashWildJobCard,
  requiresAssignedJobName,
  stripSlashWildJobCards,
} from './slashWildJob';

const PROJECT: ProjectCard = {
  id: 'p1',
  name: '測試專案',
  type: '開放政府',
  difficulty: 1,
  description: '',
  requirements: { 工程師: 4, 美術設計: 2 },
};
const SLASH_EVENT: EventCard = {
  id: 'e-slash',
  name: '斜槓青年',
  description: '',
  function_name: 'ignore_first_worker_requirement',
  type: 'basic',
};

const ENGINEER = { id: 'j1', name: '工程師' };
const LAWYER = { id: 'j2', name: '法務專家' };
const WILD_0 = { id: 'slash-0-1', name: SLASH_WILD_JOB_NAME };
const WILD_1 = { id: 'slash-1-1', name: SLASH_WILD_JOB_NAME };

const realDeckCards = (n: number, prefix = 'd'): JobCard[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, name: '工程師' }));

/**
 * Player '0' (current) and '1', 斜槓青年 in play with both entitled; the
 * market holds 8 real cards (ENGINEER, LAWYER + 6 fillers) and a deck behind it.
 * `marked` toggles the new-games marker.
 */
const makeG = ({ marked = true } = {}): GameState => {
  const G = GameStore.initialState();
  if (marked) RuleMutator.enableSlashWildJobCard(G.rules);
  PlayersMutator.initialize(G.players, ['0', '1']);
  for (const id of ['0', '1']) {
    PlayersMutator.resetActionTokens(G.players, id, 4);
    PlayersMutator.resetWorkerTokens(G.players, id, 12);
    PlayersMutator.resetOvertimeTokens(G.players, id, 1);
  }
  PlayersMutator.addProjects(G.players, '0', [PROJECT]);
  ProjectBoardMutator.initialize(G.table.projectBoard, 8);
  JobSlotsMutator.addJobCards(G.table.jobSlots, [ENGINEER, LAWYER, ...realDeckCards(6, 'm')]);
  DeckMutator.initialize(G.decks.jobs, realDeckCards(20));
  G.table.eventSlot = SLASH_EVENT;
  G.table.round = 1;
  RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0', '1'], true);
  return G;
};

const hookContext = (G: GameState, currentPlayer = '0') =>
  ({ G, ctx: { currentPlayer } as Ctx }) as never;

/** Market with player '0's wild card dealt. */
const withWild = (opts?: { marked?: boolean }) => {
  const G = makeG(opts);
  offerSlashWildJobCard(hookContext(G, '0'));
  return G;
};

/** Project owned by '1' with '0' already on 工程師. */
const withActiveProject = (G: GameState) => {
  ProjectBoardMutator.add(G.table.projectBoard, PROJECT);
  const slot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, PROJECT);
  ProjectSlotMutator.assignOwner(slot, '1', 1);
  ProjectSlotMutator.assignWorker(slot, '工程師', '0', 1);
  return slot;
};

const expectReason = (result: ValidationResult, reason: string) => {
  expect(result.valid).toBe(false);
  if (!result.valid) expect(result.reason).toBe(reason);
};

const inPiles = (G: GameState) =>
  [...G.decks.jobs.drawPile, ...G.decks.jobs.discardPile].some(isSlashWildJobCard);

const moveCtx = (G: GameState, playerID = '0') => ({ G, playerID }) as never;

describe('slash wild job helpers', () => {
  it('id format is slash-<playerID>-<round> and encodes the owner', () => {
    expect(getSlashWildJobCardId('2', 3)).toBe('slash-2-3');
    expect(getSlashWildJobCardOwner({ id: 'slash-2-3' })).toBe('2');
    expect(getSlashWildJobCardOwner({ id: 'abc' })).toBeUndefined();
  });

  it('identifies only the synthetic card and counts real cards', () => {
    expect(isSlashWildJobCard(WILD_0)).toBe(true);
    expect(isSlashWildJobCard(ENGINEER)).toBe(false);
    const slots = [WILD_0, ENGINEER, LAWYER];
    expect(getRealJobCards(slots)).toEqual([ENGINEER, LAWYER]);
    expect(getNumRealJobSlots(slots)).toBe(2);
  });

  it('requiresAssignedJobName: marked → only the own wild card; legacy → mismatched while entitled', () => {
    const marked = makeG();
    const names = Object.keys(PROJECT.requirements);
    expect(requiresAssignedJobName(marked.rules, '0', WILD_0, names)).toBe(true);
    expect(requiresAssignedJobName(marked.rules, '0', WILD_1, names)).toBe(false);
    expect(requiresAssignedJobName(marked.rules, '0', LAWYER, names)).toBe(false);
    expect(requiresAssignedJobName(marked.rules, '0', ENGINEER, names)).toBe(false);

    const legacy = makeG({ marked: false });
    expect(requiresAssignedJobName(legacy.rules, '0', LAWYER, names)).toBe(true);
    expect(requiresAssignedJobName(legacy.rules, '0', ENGINEER, names)).toBe(false);
    RuleMutator.consumeIgnoreFirstWorkerRequirement(legacy.rules, '0');
    expect(requiresAssignedJobName(legacy.rules, '0', LAWYER, names)).toBe(false);
  });
});

describe('setup marker', () => {
  it('setup() marks new games', () => {
    const G = setup({
      ctx: { numPlayers: 2, playOrder: ['0', '1'] } as Ctx,
      random: { Number: Math.random, Shuffle: <T,>(a: T[]) => a },
    } as never);
    expect(RuleSelector.isSlashWildJobCardEnabled(G.rules)).toBe(true);
  });

  it('a state without the marker is legacy', () => {
    expect(RuleSelector.isSlashWildJobCardEnabled(GameStore.initialState().rules)).toBe(false);
  });
});

describe('event handler start/end', () => {
  it('start grants every player one entitlement; end clears it', () => {
    const G = makeG();
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, [], false);
    eventCardHandlers.ignore_first_worker_requirement.start(hookContext(G));
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '0')).toBe(true);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '1')).toBe(true);
    eventCardHandlers.ignore_first_worker_requirement.end!(hookContext(G));
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '0')).toBe(false);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '1')).toBe(false);
  });
});

describe('offerSlashWildJobCard (turn begin)', () => {
  it('prepends one wild card with id slash-<player>-<round> for the entitled current player', () => {
    const G = makeG();
    offerSlashWildJobCard(hookContext(G, '0'));
    expect(G.table.jobSlots[0]).toEqual({ id: 'slash-0-1', name: SLASH_WILD_JOB_NAME });
    expect(G.table.jobSlots.filter(isSlashWildJobCard)).toHaveLength(1);
    expect(getNumRealJobSlots(G.table.jobSlots)).toBe(8);
  });

  it('is not dealt twice', () => {
    const G = makeG();
    offerSlashWildJobCard(hookContext(G, '0'));
    offerSlashWildJobCard(hookContext(G, '0'));
    expect(G.table.jobSlots.filter(isSlashWildJobCard)).toHaveLength(1);
  });

  it('is not dealt after the entitlement was used', () => {
    const G = makeG();
    RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, '0');
    offerSlashWildJobCard(hookContext(G, '0'));
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
  });

  it('is not dealt under another event', () => {
    const G = makeG();
    G.table.eventSlot = { ...SLASH_EVENT, function_name: 'project_owner_gets_two_points' };
    offerSlashWildJobCard(hookContext(G, '0'));
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
  });

  it('is never dealt in an unmarked (legacy) game', () => {
    const G = makeG({ marked: false });
    offerSlashWildJobCard(hookContext(G, '0'));
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
  });
});

describe('stripSlashWildJobCards (turn end)', () => {
  it('removes the wild card from the market, draw pile and discard pile', () => {
    const G = withWild();
    G.decks.jobs.drawPile.unshift({ ...WILD_1 });
    G.decks.jobs.discardPile.push({ ...WILD_1 });
    stripSlashWildJobCards(G);
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
    expect(inPiles(G)).toBe(false);
    expect(G.table.jobSlots).toHaveLength(8);
  });

  it('also drops a stray wild card from an unmarked game', () => {
    const G = makeG({ marked: false });
    G.table.jobSlots.unshift({ ...WILD_0 });
    stripSlashWildJobCards(G);
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
  });
});

describe('playerView', () => {
  it('shows the wild card only to its owner', () => {
    const G = withWild();
    const view = (playerID: string | null) =>
      playerView({ G, ctx: {} as Ctx, playerID }).table.jobSlots.some(isSlashWildJobCard);
    expect(view('0')).toBe(true);
    expect(view('1')).toBe(false);
    expect(view(null)).toBe(false);
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(true); // server state untouched
  });
});

describe('validateCreateProject (marked)', () => {
  it.each(['工程師', '美術設計'])('the wild card may fill any required profession (%s)', (job) => {
    expect(validateCreateProject(withWild(), '0', 'p1', WILD_0.id, job).valid).toBe(true);
  });

  it('the wild card requires an assignedJobName', () => {
    expectReason(validateCreateProject(withWild(), '0', 'p1', WILD_0.id), 'PROFESSION_TARGET_REQUIRED');
  });

  it('the wild card rejects a profession the project does not require', () => {
    expectReason(
      validateCreateProject(withWild(), '0', 'p1', WILD_0.id, '法務專家'),
      'PROFESSION_TARGET_UNAVAILABLE',
    );
  });

  it('an ordinary mismatched card is PROJECT_JOB_NOT_REQUIRED even while entitled', () => {
    const G = withWild();
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '0')).toBe(true);
    expectReason(validateCreateProject(G, '0', 'p1', LAWYER.id, '工程師'), 'PROJECT_JOB_NOT_REQUIRED');
  });

  it("another player's wild card is not playable", () => {
    const G = makeG();
    G.table.jobSlots.unshift({ ...WILD_1 });
    expectReason(validateCreateProject(G, '0', 'p1', WILD_1.id, '工程師'), 'JOB_CARD_NOT_ON_TABLE');
  });

  it('a wild card is not playable once the entitlement is spent', () => {
    const G = withWild();
    RuleMutator.consumeIgnoreFirstWorkerRequirement(G.rules, '0');
    expectReason(validateCreateProject(G, '0', 'p1', WILD_0.id, '工程師'), 'JOB_CARD_NOT_ON_TABLE');
  });
});

describe('validateRecruit (marked)', () => {
  it('the wild card may fill any open required profession', () => {
    const G = withWild();
    const slot = withActiveProject(G);
    expect(validateRecruit(G, '0', WILD_0.id, slot.id, '美術設計').valid).toBe(true);
  });

  it('requires a valid assignedJobName', () => {
    const G = withWild();
    const slot = withActiveProject(G);
    expectReason(validateRecruit(G, '0', WILD_0.id, slot.id), 'PROFESSION_TARGET_REQUIRED');
    expectReason(validateRecruit(G, '0', WILD_0.id, slot.id, '主廚'), 'PROFESSION_TARGET_UNAVAILABLE');
  });

  it('per-player duplicate check applies to the assigned profession', () => {
    const G = withWild();
    const slot = withActiveProject(G); // '0' already on 工程師
    expectReason(validateRecruit(G, '0', WILD_0.id, slot.id, '工程師'), 'WORKER_ALREADY_ASSIGNED');
  });

  it('fulfilled check applies to the assigned profession', () => {
    const G = withWild();
    const slot = withActiveProject(G);
    ProjectSlotMutator.assignWorker(slot, '美術設計', '1', 2); // 2/2
    expectReason(validateRecruit(G, '0', WILD_0.id, slot.id, '美術設計'), 'JOB_REQUIREMENT_FULFILLED');
  });

  it('an ordinary mismatched card is rejected even while entitled', () => {
    const G = withWild();
    const slot = withActiveProject(G);
    expectReason(validateRecruit(G, '0', LAWYER.id, slot.id, '美術設計'), 'PROJECT_JOB_NOT_REQUIRED');
  });
});

describe('removeAndRefillJobs / discardExcessJobCards reject the wild card', () => {
  it('validateRemoveAndRefillJobs', () => {
    const result = validateRemoveAndRefillJobs(withWild(), '0', [WILD_0.id, ENGINEER.id]);
    expectReason(result, 'SLASH_WILD_JOB_NOT_REMOVABLE');
    if (!result.valid) expect(getActionErrorMessage(result)).toMatch(/斜槓青年.* · .*wild card/);
  });

  it('removeAndRefillJobs move throws and leaves state untouched', () => {
    const G = withWild();
    const before = JSON.stringify(G);
    expect(() => removeAndRefillJobs(moveCtx(G), [WILD_0.id])).toThrow();
    expect(JSON.stringify(G)).toBe(before);
  });

  it('validateDiscardExcessJobCards', () => {
    const G = withWild();
    G.table.fourFreedomsPendingDiscards = ['m0', 'm1'];
    expectReason(validateDiscardExcessJobCards(G, [WILD_0.id, 'm0']), 'SLASH_WILD_JOB_NOT_REMOVABLE');
    expect(() =>
      discardExcessJobCards({ G, ctx: { playOrderPos: 0, numPlayers: 2 }, events: {} } as never, [WILD_0.id, 'm0']),
    ).toThrow();
    expect(G.table.jobSlots[0]).toEqual(WILD_0);
  });

  it('removeAndRefillJobs of real cards refills to maxJobSlots real cards with the wild card present', () => {
    const G = withWild();
    removeAndRefillJobs(moveCtx(G), [ENGINEER.id, LAWYER.id]);
    expect(getNumRealJobSlots(G.table.jobSlots)).toBe(8);
    expect(G.table.jobSlots[0]).toEqual(WILD_0);
    expect(inPiles(G)).toBe(false);
  });
});

describe('moves (marked)', () => {
  it('createProject with the wild card records the assigned profession and consumes the entitlement', () => {
    const G = withWild();
    const drawBefore = G.decks.jobs.drawPile.length;
    createProject(moveCtx(G), 'p1', WILD_0.id, '美術設計');
    const slot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, PROJECT);
    expect(slot.contributions).toContainEqual({ jobName: '美術設計', worker: '0', value: 1 });
    expect(slot.contributions.some((c) => c.jobName === SLASH_WILD_JOB_NAME)).toBe(false);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '0')).toBe(false);
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
    expect(inPiles(G)).toBe(false);
    // The wild card was not a market slot: no real card is drawn to replace it.
    expect(G.decks.jobs.drawPile.length).toBe(drawBefore);
    expect(G.table.jobSlots).toHaveLength(8);
    // Not offered again.
    offerSlashWildJobCard(hookContext(G, '0'));
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
  });

  it('recruit with the wild card records the assigned profession and consumes the entitlement', () => {
    const G = withWild();
    const slot = withActiveProject(G);
    recruit(moveCtx(G), WILD_0.id, slot.id, '美術設計');
    expect(slot.contributions).toContainEqual({ jobName: '美術設計', worker: '0', value: 2 });
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '0')).toBe(false);
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
    expect(inPiles(G)).toBe(false);
    expect(getNumRealJobSlots(G.table.jobSlots)).toBe(8);
  });

  it('a matching ordinary card first keeps the entitlement and the wild card; refill counts real cards only', () => {
    const G = withWild();
    createProject(moveCtx(G), 'p1', ENGINEER.id);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '0')).toBe(true);
    expect(G.table.jobSlots[0]).toEqual(WILD_0);
    expect(G.table.jobSlots).toHaveLength(9); // 8 real + the wild card
    expect(getNumRealJobSlots(G.table.jobSlots)).toBe(8);
    expect(G.decks.jobs.discardPile).toEqual([ENGINEER]);

    // …and the wild card is still playable afterwards (overtime not needed: recruit slot is free).
    const slot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, PROJECT);
    recruit(moveCtx(G), WILD_0.id, slot.id, '美術設計');
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '0')).toBe(false);
    expect(inPiles(G)).toBe(false);
  });

  it('人力釋出 with the wild card in the market discards and refills real cards only', () => {
    const G = withWild();
    eventCardHandlers.discard_and_refill_all_worker_slots.start(hookContext(G));
    expect(inPiles(G)).toBe(false);
    expect(G.decks.jobs.discardPile).toHaveLength(8);
    expect(G.table.jobSlots).toHaveLength(8);
    expect(G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
  });
});

describe('legacy (unmarked) game keeps the old semantics', () => {
  it('a mismatched ordinary card is accepted through the entitlement with assignedJobName', () => {
    const G = makeG({ marked: false });
    expect(validateCreateProject(G, '0', 'p1', LAWYER.id, '工程師').valid).toBe(true);
    expectReason(validateCreateProject(G, '0', 'p1', LAWYER.id), 'PROFESSION_TARGET_REQUIRED');
  });

  it('the first placement consumes the entitlement even with a matching card', () => {
    const G = makeG({ marked: false });
    createProject(moveCtx(G), 'p1', ENGINEER.id);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, '0')).toBe(false);
  });

  it('a stray synthetic card is not playable', () => {
    const G = makeG({ marked: false });
    G.table.jobSlots.unshift({ ...WILD_0 });
    expectReason(validateCreateProject(G, '0', 'p1', WILD_0.id, '工程師'), 'JOB_CARD_NOT_ON_TABLE');
  });
});

// ─── Full multi-turn game through boardgame.io Client ─────────────────────────

type TestClient = ReturnType<typeof Client<GameState>>;

const makeClientGame = (marked: boolean): Game<GameState> => ({
  ...OpenStarTerVillage,
  playerView: undefined, // read decks in assertions
  setup: (context) => {
    const G = setup(context, { forcedFirstEvent: 'ignore_first_worker_requirement' });
    if (!marked) delete G.rules.slashWildJobCard;
    // Keep later rounds free of 四大自由's end-of-round discard step.
    for (const card of G.decks.events.drawPile) {
      if (card.function_name === 'add_two_worker_slots') card.function_name = 'test_no_effect';
    }
    return G;
  },
});

const startClient = (marked = true): TestClient => {
  const client = Client<GameState>({ game: makeClientGame(marked), numPlayers: 2 });
  client.start();
  return client;
};

describe('full game (boardgame.io Client)', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('deals, plays and strips the wild card across turns and rounds', () => {
    const client = startClient();
    const state = () => client.getState()!;
    const assertNeverInPiles = () => expect(inPiles(state().G)).toBe(false);
    const maxJobSlots = state().G.rules.table.maxJobSlots;

    // Round 1, player 0: their wild card is first.
    expect(state().G.table.eventSlot?.function_name).toBe('ignore_first_worker_requirement');
    expect(state().ctx.currentPlayer).toBe('0');
    expect(state().G.table.jobSlots[0]).toEqual({ id: 'slash-0-1', name: SLASH_WILD_JOB_NAME });
    expect(getNumRealJobSlots(state().G.table.jobSlots)).toBe(maxJobSlots);

    // The wild card cannot be refilled away.
    client.updatePlayerID('0');
    client.moves.removeAndRefillJobs(['slash-0-1']);
    expect(state().G.table.jobSlots[0].id).toBe('slash-0-1');

    // Play it as the project's second requirement.
    const project = state().G.players['0'].hand.projects[0];
    const target = Object.keys(project.requirements)[Object.keys(project.requirements).length - 1];
    client.moves.createProject(project.id, 'slash-0-1', target);
    const slot = ProjectBoardSelector.getSlotByCard(state().G.table.projectBoard, project);
    expect(slot.contributions).toContainEqual({ jobName: target, worker: '0', value: 1 });
    expect(state().G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
    expect(state().G.table.jobSlots).toHaveLength(maxJobSlots);
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(state().G.rules, '0')).toBe(false);
    assertNeverInPiles();

    client.moves.endActionTurn();

    // Player 1: their own wild card, not player 0's.
    expect(state().ctx.currentPlayer).toBe('1');
    expect(state().G.table.jobSlots[0]).toEqual({ id: 'slash-1-1', name: SLASH_WILD_JOB_NAME });
    expect(state().G.table.jobSlots.filter(isSlashWildJobCard)).toHaveLength(1);
    expect(getNumRealJobSlots(state().G.table.jobSlots)).toBe(maxJobSlots);

    // Unused → stripped at turn end; entitlement cleared at round end.
    client.updatePlayerID('1');
    client.moves.endActionTurn();
    expect(state().G.table.round).toBe(2);
    expect(state().G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
    expect(state().G.rules.event?.ignoreFirstWorkerRequirement).toBeUndefined();
    assertNeverInPiles();

    // Round 2: nobody gets a wild card.
    for (let turn = 0; turn < 2; turn++) {
      client.updatePlayerID(state().ctx.currentPlayer);
      expect(state().G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);
      client.moves.endActionTurn();
    }
    expect(state().G.table.round).toBe(3);
    assertNeverInPiles();
    client.stop();
  });

  it('legacy (unmarked) game: no wild card; the old first-placement override still works', () => {
    const client = startClient(false);
    const state = () => client.getState()!;
    expect(state().G.table.eventSlot?.function_name).toBe('ignore_first_worker_requirement');
    expect(state().G.table.jobSlots.some(isSlashWildJobCard)).toBe(false);

    client.updatePlayerID('0');
    const [project] = state().G.players['0'].hand.projects;
    const names = Object.keys(project.requirements);
    const mismatched = state().G.table.jobSlots.find((card) => !names.includes(card.name));
    expect(mismatched).toBeDefined();
    client.moves.createProject(project.id, mismatched!.id, names[0]);
    const slot = ProjectBoardSelector.getSlotByCard(state().G.table.projectBoard, project);
    expect(slot.contributions).toContainEqual({ jobName: names[0], worker: '0', value: 1 });
    expect(RuleSelector.canIgnoreFirstWorkerRequirement(state().G.rules, '0')).toBe(false);
    client.stop();
  });
});
