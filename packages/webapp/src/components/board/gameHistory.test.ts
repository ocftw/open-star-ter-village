import type { Ctx, LogEntry } from 'boardgame.io';
import GameStore from '@/game/store/store';
import { PlayersMutator } from '@/game/store/slice/players';
import { ProjectBoardMutator } from '@/game/store/slice/projectBoard';
import { buildGameHistory } from './gameHistory';

function source(turn = 1, round = 1, log: LogEntry[] = []) {
  const G = GameStore.initialState();
  PlayersMutator.initialize(G.players, ['0', '1', '2']);
  ProjectBoardMutator.initialize(G.table.projectBoard, 3);
  for (const id of Object.keys(G.players)) {
    G.players[id].token.actions = G.rules.player.maxActionTokens;
    G.table.scoreBoard[id] = 0;
  }
  G.table.round = round;
  return { G, ctx: { turn, numPlayers: 3 } as Ctx, log };
}

function move(type: string, turn = 1, args: unknown[] | null = [], stateID = turn): LogEntry {
  return {
    action: { type: 'MAKE_MOVE', payload: { type, args, playerID: '0' } },
    _stateID: stateID, turn, phase: '',
  };
}
const project = { id: 'project', name: '國家寶藏', type: '', difficulty: 1, description: '', requirements: {} };
const event = (name: string) => ({ id: name, name, description: '', function_name: '', type: 'basic' });
const texts = (state: ReturnType<typeof buildGameHistory>) => state.entries.map((entry) => entry.text);

describe('game history builder', () => {
  it.each([
    ['recruit', '招募人力'],
    ['contributeOwnedProjects', '貢獻專案'],
    ['contributeJoinedProjects', '貢獻專案'],
    ['removeAndRefillJobs', '換人力'],
  ])('rebuilds %s with the player seat', (type, text) => {
    const state = buildGameHistory(source(1, 1, [move(type)]));
    expect(state.entries[1]).toMatchObject({ text, playerID: '0' });
  });

  it('resolves a started project by its card ID from visible G', () => {
    const input = source(1, 1, [move('createProject', 1, ['project', 'job'])]);
    input.G.table.projectBoard[0].card = project;
    expect(texts(buildGameHistory(input))).toEqual(['第 1 輪開始', '發起專案：國家寶藏']);
    input.G.table.projectBoard[0].card = undefined;
    input.G.players['0'].hand.projects.push(project);
    expect(texts(buildGameHistory(input))[1]).toBe('發起專案：國家寶藏');
  });

  it('falls back when cards are missing or arguments are redacted', () => {
    const input = source(1, 1, [move('createProject', 1, ['missing']), move('createProject', 1, null, 2)]);
    expect(texts(buildGameHistory(input))).toEqual(['第 1 輪開始', '發起專案', '發起專案']);
  });

  it('retains observed project names after settlement, with generic names after reload', () => {
    const first = source(1, 1, [move('createProject', 1, ['project'])]);
    first.G.table.projectBoard[0].card = project;
    const baseline = buildGameHistory(first);
    const saved = JSON.stringify(baseline);
    const next = source(2, 1, [...first.log, move('createProject', 2, ['missing'], 2)]);
    const settled = buildGameHistory(next, baseline);
    expect(texts(settled)).toEqual([
      '第 1 輪開始', '發起專案：國家寶藏', '發起專案', '專案結案：國家寶藏',
    ]);
    expect(texts(buildGameHistory(next, settled))).toEqual(texts(settled));
    expect(texts(buildGameHistory(next))).toEqual(['第 1 輪開始', '發起專案', '發起專案']);
    expect(JSON.stringify(baseline)).toBe(saved);
  });

  it('tolerates hidden hands, missing logs and unknown moves', () => {
    const input = source(1, 1, [move('futureMove'), move('endActionTurn'), move('createProject')]);
    const { hand, ...publicPlayer } = input.G.players['1'];
    const client = { ...input, G: { ...input.G, players: { ...input.G.players, '1': publicPlayer } } };
    expect(texts(buildGameHistory(client))).toEqual(['第 1 輪開始', '發起專案']);
    expect(texts(buildGameHistory({ ...client, log: undefined }))).toEqual(['第 1 輪開始']);
  });

  it('uses log position rather than state ID to order moves', () => {
    const input = source(1, 1, [move('recruit', 1, [], 9), move('removeAndRefillJobs', 1, [], 3)]);
    expect(texts(buildGameHistory(input))).toEqual(['第 1 輪開始', '招募人力', '換人力']);
  });

  it('maps log turns across the round boundary using G.table.round as the anchor', () => {
    const input = source(7, 12, [move('recruit', 3), move('recruit', 4), move('recruit', 6), move('recruit', 7)]);
    input.G.table.eventSlot = event('人力釋出');
    expect(texts(buildGameHistory(input))).toEqual([
      '第 10 輪開始', '招募人力', '第 11 輪開始', '招募人力', '招募人力',
      '第 12 輪開始 · 事件：人力釋出', '招募人力',
    ]);
  });

  it.each([2, 3, 4])('keeps final-round moves and settlement in their rounds with %i players', (numPlayers) => {
    const log = [move('recruit', 1), move('contributeOwnedProjects', numPlayers * 2)];
    const first = source(numPlayers * 2, 2, log);
    first.ctx.numPlayers = numPlayers;
    first.G.table.eventSlot = event('最後一輪');
    first.G.table.projectBoard[0].card = project;
    const baseline = buildGameHistory(first);
    const expected = ['第 1 輪開始', '招募人力', '第 2 輪開始 · 事件：最後一輪', '貢獻專案'];
    expect(texts(baseline)).toEqual(expected);

    const next = source(numPlayers * 2 + 1, 2, [...log, move('endActionTurn', numPlayers * 2, [], 99)]);
    next.ctx.numPlayers = numPlayers;
    next.ctx.gameover = { winners: ['0'] };
    next.G.table.scoreBoard['0'] = 5;
    const finished = buildGameHistory(next, baseline);
    expect(texts(finished)).toEqual([...expected, '專案結案：國家寶藏', '影響力 +5']);
    expect(texts(buildGameHistory(next, finished))).toEqual(texts(finished));
    expect(texts(buildGameHistory(next))).toEqual([
      '第 1 輪開始', '招募人力', '第 2 輪開始', '貢獻專案',
    ]);
  });

  it.each([6, 7])('anchors game-over history on G.table.round with terminal turn %i', (turn) => {
    const input = source(turn, 12, [move('recruit', 3), move('removeAndRefillJobs', 6)]);
    input.ctx.gameover = { winners: ['0'] };
    expect(texts(buildGameHistory(input))).toEqual([
      '第 11 輪開始', '招募人力', '第 12 輪開始', '換人力',
    ]);
  });

  it('retains event names observed live, but only knows the current event after reload', () => {
    const first = source();
    first.G.table.eventSlot = event('人力釋出');
    const baseline = buildGameHistory(first);
    const next = source(4, 2, [move('recruit', 1)]);
    next.G.table.eventSlot = event('斜槓青年');
    expect(texts(buildGameHistory(next, baseline))).toEqual([
      '第 1 輪開始 · 事件：人力釋出', '招募人力', '第 2 輪開始 · 事件：斜槓青年',
    ]);
    expect(texts(buildGameHistory(next))).toEqual([
      '第 1 輪開始', '招募人力', '第 2 輪開始 · 事件：斜槓青年',
    ]);
  });

  it('diffs removed projects and positive score changes once without mutating its inputs', () => {
    const first = source(1, 1, [move('recruit')]);
    first.G.table.projectBoard[0].card = project;
    const baseline = buildGameHistory(first);
    const saved = JSON.stringify(baseline);
    const next = source(2, 1, [...first.log, move('endActionTurn', 1, [], 2)]);
    next.G.table.scoreBoard = { '0': 5, '1': -1, '2': 0 };
    const result = buildGameHistory(next, baseline);
    expect(texts(result)).toEqual(['第 1 輪開始', '招募人力', '專案結案：國家寶藏', '影響力 +5']);
    expect(result.entries[3].playerID).toBe('0');
    expect(texts(buildGameHistory(next, result))).toEqual(texts(result));
    expect(JSON.stringify(baseline)).toBe(saved);
    expect(next.G.table.projectBoard[0].card).toBeUndefined();
  });

  it('does not treat a card moving between slots as a closure', () => {
    const first = source();
    first.G.table.projectBoard[0].card = project;
    const next = source();
    next.G.table.projectBoard[1].card = project;
    expect(buildGameHistory(next, buildGameHistory(first)).diffs).toEqual([]);
  });

  it.each([true, false])('adds youth subsidy for a live round start (recipient=%s)', (hasRecipient) => {
    const first = source(3, 1);
    const next = source(4, 2, [move('endActionTurn', 3)]);
    next.G.table.eventSlot = event('青年補助');
    next.G.rules.player.maxActionTokens = 6;
    for (const player of Object.values(next.G.players)) player.token.actions = 6;
    if (hasRecipient) next.G.players['2'].token.actions = 7;
    const result = buildGameHistory(next, buildGameHistory(first));
    expect(result.entries.at(-1)).toMatchObject({
      text: hasRecipient ? '青年補助：本輪多 1 個行動點' : '青年補助：最低分不只一位，本輪無人獲得',
      playerID: hasRecipient ? '2' : undefined,
    });
  });

  it('does not emit session diffs or youth subsidy on the first render after reload', () => {
    const input = source(4, 2, [move('createProject', 1, ['project']), move('recruit', 4)]);
    input.G.table.eventSlot = event('青年補助');
    input.G.table.scoreBoard['0'] = 20;
    input.G.players['0'].token.actions = 5;
    const baseline = buildGameHistory(input);
    expect(baseline.diffs).toEqual([]);
    expect(baseline.roundExtras).toEqual({});
    expect(texts(baseline)).toEqual(['第 1 輪開始', '發起專案', '第 2 輪開始 · 事件：青年補助', '招募人力']);
  });

  it('orders moves T → closures/points → round/youth → moves T+1, even after the next move arrives', () => {
    const first = source(3, 1, [move('contributeOwnedProjects', 3)]);
    first.G.table.projectBoard[0].card = project;
    const baseline = buildGameHistory(first);
    const next = source(4, 2, [...first.log, move('endActionTurn', 3, [], 4)]);
    next.G.table.eventSlot = event('青年補助');
    next.G.table.scoreBoard['0'] = 8;
    const settlement = buildGameHistory(next, baseline);
    const later = { ...next, log: [...next.log, move('recruit', 4, [], 5)] };
    expect(texts(buildGameHistory(later, settlement))).toEqual([
      '第 1 輪開始', '貢獻專案', '專案結案：國家寶藏', '影響力 +8',
      '第 2 輪開始 · 事件：青年補助', '青年補助：最低分不只一位，本輪無人獲得', '招募人力',
    ]);
  });

  it('keeps session diffs if reconnect omits their log anchor', () => {
    const first = source(3, 1, [move('recruit', 3)]);
    const next = source(4, 2, [...first.log, move('endActionTurn', 3, [], 4)]);
    next.G.table.scoreBoard['0'] = 2;
    const settlement = buildGameHistory(next, buildGameHistory(first));
    const reconnected = { ...next, log: [move('recruit', 4)] };
    expect(texts(buildGameHistory(reconnected, settlement))).toEqual([
      '第 1 輪開始', '影響力 +2', '第 2 輪開始', '招募人力',
    ]);
  });
});
