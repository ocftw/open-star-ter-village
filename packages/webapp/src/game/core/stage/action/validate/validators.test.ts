/**
 * Shared action validators: one assertion per stable reason code,
 * plus happy paths, so client preflight and server moves cannot drift.
 */
import GameStore, { GameState } from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { ProjectBoardMutator, ProjectBoardSelector } from '@/game/store/slice/projectBoard';
import { ProjectSlotMutator } from '@/game/store/slice/projectSlot/projectSlot';
import { JobSlotsMutator } from '@/game/store/slice/jobSlots';
import { ActionSlotMutator } from '@/game/store/slice/actionSlot';
import { RuleMutator } from '@/game/store/slice/rule';
import { ProjectCard } from '@/game/card';
import {
  getActionErrorMessage,
  GENERIC_ACTION_ERROR_MESSAGE,
  validateContributeJoinedProjects,
  validateContributeOwnedProjects,
  validateCreateProject,
  validateDiscardExcessJobCards,
  validateMirror,
  validateRecruit,
  validateRemoveAndRefillJobs,
} from './index';

const PROJECT_CARD: ProjectCard = {
  id: 'p1',
  name: '測試專案',
  type: '開放政府',
  difficulty: 1,
  description: '',
  requirements: { 工程師: 4, 美術設計: 2 },
};

const JOB_ENGINEER = { id: 'j1', name: '工程師' };
const JOB_LAWYER = { id: 'j2', name: '法務專家' };

/** Playable baseline: player '0' with tokens, one project card in hand, two job cards on the table. */
const makeG = (): GameState => {
  const G = GameStore.initialState();
  PlayersMutator.initialize(G.players, ['0', '1']);
  PlayersMutator.resetActionTokens(G.players, '0', 4);
  PlayersMutator.resetWorkerTokens(G.players, '0', 12);
  PlayersMutator.addProjects(G.players, '0', [PROJECT_CARD]);
  ProjectBoardMutator.initialize(G.table.projectBoard, 8);
  JobSlotsMutator.addJobCards(G.table.jobSlots, [JOB_ENGINEER, JOB_LAWYER]);
  return G;
};

/** Occupied project owned by '1' with '0' recruited on 工程師. */
const withActiveProject = (G: GameState, owner = '1') => {
  ProjectBoardMutator.add(G.table.projectBoard, PROJECT_CARD);
  const slot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, PROJECT_CARD);
  ProjectSlotMutator.assignOwner(slot, owner, 1);
  ProjectSlotMutator.assignWorker(slot, '工程師', '0', 1);
  return slot;
};

const expectReason = (result: ReturnType<typeof validateCreateProject>, reason: string) => {
  expect(result.valid).toBe(false);
  if (!result.valid) expect(result.reason).toBe(reason);
};

describe('validateCreateProject', () => {
  it('passes for a matching card with resources available', () => {
    expect(validateCreateProject(makeG(), '0', 'p1', 'j1').valid).toBe(true);
  });

  it('ACTION_OCCUPIED when the slot was used this turn', () => {
    const G = makeG();
    ActionSlotMutator.occupy(G.table.actionSlots.createProject);
    expectReason(validateCreateProject(G, '0', 'p1', 'j1'), 'ACTION_OCCUPIED');
  });

  it('ignoreOccupied skips only the occupancy check (overtime preflight)', () => {
    const G = makeG();
    ActionSlotMutator.occupy(G.table.actionSlots.createProject);
    expect(validateCreateProject(G, '0', 'p1', 'j1', { ignoreOccupied: true }).valid).toBe(true);
  });

  it('INSUFFICIENT_ACTION_TOKENS with required/available details', () => {
    const G = makeG();
    PlayersMutator.resetActionTokens(G.players, '0', 0);
    const result = validateCreateProject(G, '0', 'p1', 'j1');
    expectReason(result, 'INSUFFICIENT_ACTION_TOKENS');
    if (!result.valid) expect(result.details).toEqual({ required: 2, available: 0 });
  });

  it('INSUFFICIENT_WORKER_TOKENS when workers run out', () => {
    const G = makeG();
    PlayersMutator.resetWorkerTokens(G.players, '0', 1);
    expectReason(validateCreateProject(G, '0', 'p1', 'j1'), 'INSUFFICIENT_WORKER_TOKENS');
  });

  it('PROJECT_BOARD_FULL when every slot has a card', () => {
    const G = makeG();
    for (let i = 0; i < 8; i++) {
      ProjectBoardMutator.add(G.table.projectBoard, { ...PROJECT_CARD, id: `fill-${i}` });
    }
    expectReason(validateCreateProject(G, '0', 'p1', 'j1'), 'PROJECT_BOARD_FULL');
  });

  it('PROJECT_CARD_NOT_IN_HAND for a stale hand card id', () => {
    expectReason(validateCreateProject(makeG(), '0', 'nope', 'j1'), 'PROJECT_CARD_NOT_IN_HAND');
  });

  it('JOB_CARD_NOT_ON_TABLE for a stale job card id', () => {
    expectReason(validateCreateProject(makeG(), '0', 'p1', 'nope'), 'JOB_CARD_NOT_ON_TABLE');
  });

  it('PROJECT_JOB_NOT_REQUIRED with the job name in details', () => {
    const result = validateCreateProject(makeG(), '0', 'p1', 'j2');
    expectReason(result, 'PROJECT_JOB_NOT_REQUIRED');
    if (!result.valid) expect(result.details).toEqual({ jobName: '法務專家' });
  });

  it('passes for a mismatched card while 斜槓青年 grants the override', () => {
    const G = makeG();
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, ['0'], true);
    expect(validateCreateProject(G, '0', 'p1', 'j2').valid).toBe(true);
  });
});

describe('validateRecruit', () => {
  it('passes when the project needs the job', () => {
    const G = makeG();
    const slot = withActiveProject(G);
    // recruit a different profession the player has not taken yet
    JobSlotsMutator.addJobCards(G.table.jobSlots, [{ id: 'j3', name: '美術設計' }]);
    expect(validateRecruit(G, '0', 'j3', slot.id).valid).toBe(true);
  });

  it('PROJECT_SLOT_NOT_FOUND for a stale slot id', () => {
    expectReason(validateRecruit(makeG(), '0', 'j1', 'project-slot-99'), 'PROJECT_SLOT_NOT_FOUND');
  });

  it('PROJECT_SLOT_NOT_FOUND for an empty slot', () => {
    expectReason(validateRecruit(makeG(), '0', 'j1', 'project-slot-0'), 'PROJECT_SLOT_NOT_FOUND');
  });

  it('WORKER_ALREADY_ASSIGNED for a duplicate profession', () => {
    const G = makeG();
    const slot = withActiveProject(G);
    expectReason(validateRecruit(G, '0', 'j1', slot.id), 'WORKER_ALREADY_ASSIGNED');
  });

  it('JOB_REQUIREMENT_FULFILLED when the position is complete', () => {
    const G = makeG();
    const slot = withActiveProject(G);
    ProjectSlotMutator.pushWorker(slot, '工程師', '0', 3); // 4/4
    JobSlotsMutator.addJobCards(G.table.jobSlots, [{ id: 'j4', name: '工程師' }]);
    PlayersMutator.initialize(G.players, ['2']);
    PlayersMutator.resetActionTokens(G.players, '2', 4);
    PlayersMutator.resetWorkerTokens(G.players, '2', 12);
    expectReason(validateRecruit(G, '2', 'j4', slot.id), 'JOB_REQUIREMENT_FULFILLED');
  });

  it('PROJECT_JOB_NOT_REQUIRED for a mismatched card without the event', () => {
    const G = makeG();
    const slot = withActiveProject(G);
    expectReason(validateRecruit(G, '0', 'j2', slot.id), 'PROJECT_JOB_NOT_REQUIRED');
  });
});

describe('validateContributeOwnedProjects / validateContributeJoinedProjects', () => {
  it('CONTRIBUTION_EMPTY for an empty allocation', () => {
    expectReason(validateContributeOwnedProjects(makeG(), '0', []), 'CONTRIBUTION_EMPTY');
  });

  it('PROJECT_NOT_OWNED when contributing (own) to another player project', () => {
    const G = makeG();
    const slot = withActiveProject(G, '1');
    expectReason(
      validateContributeOwnedProjects(G, '0', [{ projectSlotId: slot.id, jobName: '工程師', value: 1 }]),
      'PROJECT_NOT_OWNED',
    );
  });

  it('PROJECT_NOT_JOINED when contributing (joined) to an own project', () => {
    const G = makeG();
    const slot = withActiveProject(G, '0');
    expectReason(
      validateContributeJoinedProjects(G, '0', [{ projectSlotId: slot.id, jobName: '工程師', value: 1 }]),
      'PROJECT_NOT_JOINED',
    );
  });

  it('NO_WORKER_ON_JOB without an assigned worker on the row', () => {
    const G = makeG();
    const slot = withActiveProject(G, '0');
    expectReason(
      validateContributeOwnedProjects(G, '0', [{ projectSlotId: slot.id, jobName: '美術設計', value: 1 }]),
      'NO_WORKER_ON_JOB',
    );
  });

  it('CONTRIBUTION_EXCEEDS_LIMIT above the per-action maximum', () => {
    const G = makeG();
    const slot = withActiveProject(G, '0');
    const result = validateContributeOwnedProjects(G, '0', [
      { projectSlotId: slot.id, jobName: '工程師', value: 99 },
    ]);
    expectReason(result, 'CONTRIBUTION_EXCEEDS_LIMIT');
  });

  it('passes for a valid owned contribution', () => {
    const G = makeG();
    const slot = withActiveProject(G, '0');
    expect(
      validateContributeOwnedProjects(G, '0', [{ projectSlotId: slot.id, jobName: '工程師', value: 1 }]).valid,
    ).toBe(true);
  });
});

describe('validateRemoveAndRefillJobs', () => {
  it('NO_JOB_CARDS_SELECTED for an empty selection', () => {
    expectReason(validateRemoveAndRefillJobs(makeG(), '0', []), 'NO_JOB_CARDS_SELECTED');
  });

  it('JOB_CARDS_NOT_ON_TABLE when an id is stale', () => {
    expectReason(validateRemoveAndRefillJobs(makeG(), '0', ['j1', 'nope']), 'JOB_CARDS_NOT_ON_TABLE');
  });

  it('passes for cards on the table', () => {
    expect(validateRemoveAndRefillJobs(makeG(), '0', ['j1', 'j2']).valid).toBe(true);
  });
});

describe('validateDiscardExcessJobCards', () => {
  it('NO_PENDING_DISCARDS outside the 四大自由 window', () => {
    expectReason(validateDiscardExcessJobCards(makeG(), ['j1', 'j2']), 'NO_PENDING_DISCARDS');
  });

  it('DISCARD_COUNT_INVALID unless exactly 2 cards are chosen', () => {
    const G = makeG();
    G.table.fourFreedomsPendingDiscards = ['x'];
    expectReason(validateDiscardExcessJobCards(G, ['j1']), 'DISCARD_COUNT_INVALID');
  });

  it('passes for exactly 2 table cards during the window', () => {
    const G = makeG();
    G.table.fourFreedomsPendingDiscards = ['x'];
    expect(validateDiscardExcessJobCards(G, ['j1', 'j2']).valid).toBe(true);
  });
});

describe('validateMirror (加班 Overtime)', () => {
  it('OVERTIME_UNAVAILABLE once the mirror slot is used', () => {
    const G = makeG();
    ActionSlotMutator.occupy(G.table.actionSlots.mirror);
    ActionSlotMutator.occupy(G.table.actionSlots.recruit);
    expectReason(validateMirror(G, '0', 'recruit'), 'OVERTIME_UNAVAILABLE');
  });

  it('OVERTIME_INELIGIBLE_ACTION for a 2-AP action', () => {
    const G = makeG();
    ActionSlotMutator.occupy(G.table.actionSlots.createProject);
    expectReason(validateMirror(G, '0', 'createProject'), 'OVERTIME_INELIGIBLE_ACTION');
  });

  it('INSUFFICIENT_ACTION_TOKENS without AP for the mirror cost', () => {
    const G = makeG();
    ActionSlotMutator.occupy(G.table.actionSlots.recruit);
    PlayersMutator.resetActionTokens(G.players, '0', 0);
    expectReason(validateMirror(G, '0', 'recruit'), 'INSUFFICIENT_ACTION_TOKENS');
  });

  it('OVERTIME_TARGET_NOT_USED when the target slot is still free', () => {
    expectReason(validateMirror(makeG(), '0', 'recruit'), 'OVERTIME_TARGET_NOT_USED');
  });

  it('passes for an occupied 1-AP action with AP available', () => {
    const G = makeG();
    ActionSlotMutator.occupy(G.table.actionSlots.recruit);
    expect(validateMirror(G, '0', 'recruit').valid).toBe(true);
  });
});

describe('bilingual messages', () => {
  it('interpolates dynamic values from details', () => {
    expect(
      getActionErrorMessage({ valid: false, reason: 'PROJECT_JOB_NOT_REQUIRED', details: { jobName: '法務專家' } }),
    ).toBe('這個專案沒有「法務專家」的職業位置。 · This project has no 法務專家 position.');
    expect(
      getActionErrorMessage({ valid: false, reason: 'INSUFFICIENT_ACTION_TOKENS', details: { required: 2, available: 0 } }),
    ).toContain('2');
  });

  it('every reason code has bilingual copy with no internal text', () => {
    const codes = [
      'ACTION_UNAVAILABLE', 'ACTION_OCCUPIED', 'INSUFFICIENT_ACTION_TOKENS', 'INSUFFICIENT_WORKER_TOKENS',
      'PROJECT_CARD_NOT_IN_HAND', 'JOB_CARD_NOT_ON_TABLE', 'PROJECT_BOARD_FULL', 'PROJECT_JOB_NOT_REQUIRED',
      'PROJECT_SLOT_NOT_FOUND', 'WORKER_ALREADY_ASSIGNED', 'JOB_REQUIREMENT_FULFILLED', 'PROJECT_NOT_OWNED',
      'PROJECT_NOT_JOINED', 'NO_WORKER_ON_JOB', 'CONTRIBUTION_EMPTY', 'CONTRIBUTION_EXCEEDS_LIMIT',
      'NO_JOB_CARDS_SELECTED', 'JOB_CARDS_NOT_ON_TABLE', 'NO_PENDING_DISCARDS', 'DISCARD_COUNT_INVALID',
      'OVERTIME_UNAVAILABLE', 'OVERTIME_INELIGIBLE_ACTION', 'OVERTIME_TARGET_NOT_USED',
    ] as const;
    codes.forEach((reason) => {
      const message = getActionErrorMessage({ valid: false, reason });
      expect(message).toContain(' · '); // zh-TW primary · English secondary
      expect(message).not.toMatch(/Error|stack|exception/i);
    });
  });

  it('unknown codes fall back to the generic state-unchanged message', () => {
    expect(getActionErrorMessage({ valid: false, reason: 'WHAT' as never })).toBe(GENERIC_ACTION_ERROR_MESSAGE);
  });
});
