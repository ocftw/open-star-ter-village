import { Client } from 'boardgame.io/client';
import { INVALID_MOVE } from 'boardgame.io/core';
import { OpenStarTerVillage } from '../game';
import { setup } from '../core/setup';
import { GameState } from '../store/store';
import { roomSetupError } from './config';
import { standardState } from './state';
import { predecessors, growthReason, NODES } from './tree';
import { advanceStandard, beginStandardEvent, choiceOptions, enqueue, growTree, resolveStandardChoice, syncTreeRules } from './engine';
import { playerView } from '../core/playerView';
import type { FnContext } from 'boardgame.io';
import { createProject } from '../core/stage/action/move/createProject';
import { eventCardHandlers } from '../core/handler/eventCardHandlers';
import { validateCreateProject } from '../core/stage/action/validate';

function fixture(numPlayers = 2) {
  const client = Client({ game: { ...OpenStarTerVillage, playerView: ({ G }) => G, seed: 'standard-test', setup: ctx => setup(ctx, { ruleset: 'tree-poc-v1', forcedFirstEvent: 'digital_minister' }) }, numPlayers });
  client.start();
  return client;
}
function state() { return structuredClone(fixture().getState()!.G); }
function context(G: GameState, playerID = '0') {
  return { G, ctx: { currentPlayer: '0', numPlayers: 2, playOrderPos: 0, activePlayers: { '0': 'action' } }, playerID, events: { setActivePlayers: jest.fn() } } as unknown as FnContext<GameState> & { playerID: string };
}
function project(G: GameState, id: string, owner = '0', value = 1, requirement = 4, jobName = '工程師', worker = '0') {
  const slot = G.table.projectBoard.find(s => !s.card)!;
  Object.assign(slot, { card: { id, name: id, type: 'ignored', difficulty: 1, description: '', requirements: { [jobName]: requirement } }, owner, ownerToken: 1, lastContributor: worker, contributions: [{ jobName, worker, value }] });
  return slot;
}

describe('Standard room contract', () => {
  test.each([2, 3, 4])('allows %i Standard players with correct baseline and event count', n => {
    expect(roomSetupError({ ruleset: 'tree-poc-v1' }, n)).toBeUndefined();
    const G = fixture(n).getState()!.G;
    expect(G.standard?.version).toBe('tree-poc-v1');
    expect(G.rules.numNonEndGameEventCards).toBe(8 - n);
    expect(G.decks.events.drawPile).toHaveLength(8 - n);
    expect(G.table.jobSlots).toHaveLength(6);
    expect(G.table.projectBoard).toHaveLength(6);
    expect(G.players['0'].token.actions).toBe(3);
    expect(G.players['0'].hand.projects.every(c => c.difficulty <= 2)).toBe(true);
    expect(G.decks.advanced!.drawPile.every(c => c.difficulty > 2)).toBe(true);
  });
  test.each([0, 1, 5, 6, 2.5])('rejects %i Standard players', n => expect(roomSetupError({ ruleset: 'tree-poc-v1' }, n)).toBeDefined());
  test('preserves simple count bounds and rejects unknown rulesets', () => {
    expect(roomSetupError(undefined, 2)).toBeDefined();
    expect(roomSetupError(undefined, 6)).toBeUndefined();
    expect(roomSetupError({ ruleset: 'tree-poc-v1' }, 3, false)).toBe('Standard Mode is disabled');
    expect(roomSetupError(undefined, 3, false)).toBeUndefined();
    expect(roomSetupError({ ruleset: 'other' }, 3)).toBeDefined();
  });
  test('does not expose decks or other hands', () => {
    const G = state(); G.standard!.grown.push('government-2'); syncTreeRules(G);
    const view = playerView({ G, ctx: fixture().getState()!.ctx, playerID: '0' });
    expect(view).not.toHaveProperty('decks');
    expect(view.players['1']).not.toHaveProperty('hand');
    expect(view.standard!.nextEvent).toEqual(G.decks.events.drawPile[0]);
  });
});

describe('tree', () => {
  test('uses the eight directed diagonal edges', () => {
    expect(predecessors('source-2')).toEqual(['source-1', 'data-1']);
    expect(predecessors('government-2')).toEqual(['government-1']);
    expect(predecessors('source-3')).toEqual(['source-2']);
    expect(predecessors('government-3')).toEqual(['government-2', 'data-2']);
    expect(predecessors('source-4')).toContain('data-3');
    expect(predecessors('data-5')).toContain('source-4');
  });
  test.each([[3, 3], [4, 6], [5, 9]])('tier %i requires %i village completions', (tier, threshold) => {
    const G = state(); G.standard!.grown = [`source-${tier - 1}` as never];
    const node = `source-${tier}` as never;
    G.standard!.completedProjectIds = Array.from({ length: threshold - 1 }, (_, i) => `${i}`);
    expect(growthReason(G, node, '0')).toMatch('需要');
    G.standard!.completedProjectIds.push('last');
    expect(growthReason(G, node, '0')).toBeUndefined();
  });
  test('charges AP, scores once, enforces capacity and overtime', () => {
    const G = state(); const c = context(G);
    growTree(c, 'source-1');
    expect(G.players['0'].token.actions).toBe(2);
    expect(G.table.scoreBoard['0']).toBe(1);
    expect(G.table.jobSlots).toHaveLength(8);
    expect(growTree(c, 'source-1')).toBe(INVALID_MOVE);
    expect(growTree(c, 'data-1')).toBe(INVALID_MOVE);
    growTree(c, 'data-1', true);
    expect(G.players['0'].token.overtime).toBe(0);
    expect(growthReason(G, 'government-1', '0')).toContain('已滿');
    expect(growTree(c, 'government-1', true)).toBe(INVALID_MOVE);
  });
  test('all numeric abilities and temporary effects compose', () => {
    const G = state(); G.standard!.grown = [...NODES]; syncTreeRules(G);
    expect(G.rules.player.maxProjectCards).toBe(3);
    expect(G.rules.action.recruit.initialContributionValue).toBe(2);
    expect(G.rules.action.createProject.actionCost).toBe(1);
    expect(G.rules.action.contributeOwnedProjects.maxContributionValue).toBe(4);
    expect(G.rules.action.contributeJoinedProjects.maxContributionValue).toBe(5);
    expect(G.table.projectBoard).toHaveLength(8);
    const c = context(G); eventCardHandlers.increase_one_owned_project_contribution_value.start(c);
    expect(G.rules.action.contributeOwnedProjects.maxContributionValue).toBe(5);
    eventCardHandlers.increase_one_owned_project_contribution_value.end!(c);
    expect(G.rules.action.contributeOwnedProjects.maxContributionValue).toBe(4);
  });
  test('Data 3 grants an immediately spendable extra AP to each player once', () => {
    const G = state(); G.standard!.grown = ['data-2']; G.standard!.completedProjectIds = ['a','b','c'];
    G.players['0'].token.actions = 1;
    growTree(context(G), 'data-3');
    expect(G.players['0'].token.actions).toBe(1);
    expect(G.players['1'].token.actions).toBe(4);
    expect(growTree(context(G), 'data-3')).toBe(INVALID_MOVE);
    expect(G.players['1'].token.actions).toBe(4);
  });
  test('Source 3 engineer starts at three and Data 5 accepts mismatched labor', () => {
    const G = state(); G.standard!.grown = ['source-3','data-5'];
    G.players['0'].hand.projects = [{ id:'hand',name:'test',type:'ignored',difficulty:1,description:'',requirements:{ '文字工作者':5 } }];
    G.table.jobSlots = [{ id:'engineer',name:'工程師' }];
    expect(validateCreateProject(G,'0','hand','engineer','文字工作者').valid).toBe(true);
    createProject(context(G),'hand','engineer','文字工作者');
    expect(G.table.projectBoard[0].contributions[0].value).toBe(3);
  });
});

describe('server-owned choices', () => {
  test('minister allows another player cube, rejects wrong actor and stale IDs', () => {
    const G = state(); project(G,'p','1',1,2,'工程師','0');
    G.standard!.phase = 'event'; enqueue(G,'digitalMinister','1','p');
    const choice = G.standard!.choices[0]; const option = choiceOptions(G,choice)[0];
    const before = structuredClone(G);
    expect(resolveStandardChoice(context(G,'0'),choice.id,option.target)).toBe(INVALID_MOVE);
    expect(G).toEqual(before);
    resolveStandardChoice(context(G,'1'),choice.id,option.target);
    expect(resolveStandardChoice(context(G,'1'),choice.id,option.target)).toBe(INVALID_MOVE);
    advanceStandard(context(G));
    expect(G.standard!.completedProjectIds).toEqual(['p']);
    expect(G.table.scoreBoard).toEqual({'0':4,'1':2});
    advanceStandard(context(G));
    expect(G.table.scoreBoard).toEqual({'0':4,'1':2});
  });
  test('skips impossible minister targets and returns to action', () => {
    const G = state(); G.standard!.phase = 'event'; enqueue(G,'digitalMinister','0','missing');
    advanceStandard(context(G)); expect(G.standard!.phase).toBe('action'); expect(G.standard!.choices).toEqual([]);
  });
  test('Government 4 consumes one card/token, no AP, and respects Data 2', () => {
    const G = state(); project(G,'new'); project(G,'other','1',0,5,'工程師','1');
    G.standard!.grown = ['data-2']; syncTreeRules(G);
    G.table.jobSlots = [{id:'j',name:'工程師'}]; enqueue(G,'government4','0','new');
    const c = G.standard!.choices[0]; expect(choiceOptions(G,c).every(o=>o.target.projectId === 'other')).toBe(true);
    const ap = G.players['0'].token.actions, workers = G.players['0'].token.workers;
    resolveStandardChoice(context(G), c.id, choiceOptions(G,c)[0].target);
    expect(G.players['0'].token.actions).toBe(ap); expect(G.players['0'].token.workers).toBe(workers-1);
    expect(G.table.projectBoard[1].contributions.find(c=>c.worker === '0')!.value).toBe(2);
  });
  test('settlement queues Source 4 then floored Government 5 and chains completions', () => {
    const G = state(); G.standard!.grown = ['source-4','government-5'];
    project(G,'complete','0',5,5); project(G,'target','0',1,2);
    G.standard!.phase = 'settlement'; advanceStandard(context(G));
    expect(G.standard!.choices.map(c=>c.kind)).toEqual(['source4','government5']);
    expect(G.standard!.choices[1].budget).toBe(2);
    const c = G.standard!.choices[0]; resolveStandardChoice(context(G),c.id,choiceOptions(G,c)[0].target);
    advanceStandard(context(G));
    expect(G.standard!.completedProjectIds).toEqual(['complete','target']);
    expect(G.standard!.choices).toEqual([]);
    expect(G.standard!.phase).toBe('ready');
  });
  test('Government 5 partial allocations receive fresh IDs and cannot exceed capacity', () => {
    const G = state(); project(G,'p','0',1,2); enqueue(G,'government5','0','closed',3);
    const c = G.standard!.choices[0]; const target = choiceOptions(G,c)[0].target;
    resolveStandardChoice(context(G),c.id,target);
    expect(G.standard!.choices[0].id).not.toBe(c.id);
    expect(resolveStandardChoice(context(G),c.id,target)).toBe(INVALID_MOVE);
    expect(choiceOptions(G,G.standard!.choices[0])).toEqual([]);
  });
  test.each([20,21])('restoration advanced eligibility at %i points', score => {
    const G = state(); G.standard!.phase = 'restore'; G.players['0'].hand.projects = []; G.table.scoreBoard['0'] = score;
    advanceStandard(context(G));
    if (score === 20) { expect(G.standard!.phase).toBe('ready'); expect(G.players['0'].hand.projects.every(c=>c.difficulty<=2)).toBe(true); }
    else {
      const c=G.standard!.choices[0]; expect(c.kind).toBe('draw');
      resolveStandardChoice(context(G),c.id,{projectId:'',pile:'advanced'});
      expect(G.players['0'].hand.projects[0].difficulty).toBeGreaterThan(2);
    }
  });
});

describe('complete Standard games using real boardgame.io flow', () => {
  test.each([2,3,4])('finishes a %i-player game without stuck stages', n => {
    const client=fixture(n);
    let iterations=0;
    while (!client.getState()!.ctx.gameover && iterations++ < 150) {
      const { G, ctx }=client.getState()!;
      const c=G.standard!.choices[0];
      if(c) { client.updatePlayerID(c.playerId); client.moves.resolveStandardChoice(c.id,c.kind==='draw'?choiceOptions(G,c)[0].target:null); continue; }
      client.updatePlayerID(ctx.currentPlayer);
      const node=NODES.find(id=>!growthReason(G,id,ctx.currentPlayer));
      if(node) client.moves.growTree(node);
      else if(ctx.playOrderPos===n-1 && G.table.fourFreedomsPendingDiscards.length) client.moves.discardExcessJobCards(G.table.jobSlots.slice(0,2).map(c=>c.id));
      else client.moves.endActionTurn();
    }
    expect(iterations).toBeLessThan(150);
    expect(client.getState()!.ctx.gameover).toBeDefined();
    expect(client.getState()!.G.standard!.round).toBe(9-n);
    client.stop();
  });
});

describe('cross-player stage integration', () => {
  test('event choices activate the initiator, persist, and return to the original turn', () => {
    const client=Client({game:{...OpenStarTerVillage, playerView:({G})=>G, seed:'choices', setup:ctx=>{
      const G=setup(ctx,{ruleset:'tree-poc-v1',forcedFirstEvent:'digital_minister'});
      project(G,'event-project','1',1,4,'工程師','0'); return G;
    }}, numPlayers:2});
    client.start();
    let snapshot=client.getState()!;
    expect(snapshot.ctx.activePlayers).toEqual({'1':'standardChoice'});
    const c=snapshot.G.standard!.choices[0];
    client.updatePlayerID('1');
    client.moves.resolveStandardChoice(c.id,choiceOptions(snapshot.G,c)[0].target);
    snapshot=client.getState()!;
    expect(snapshot.G.table.projectBoard[0].contributions[0].value).toBe(2);
    expect(snapshot.ctx.activePlayers).toEqual({'0':'action'});
    expect(snapshot.ctx.currentPlayer).toBe('0');
    client.stop();
  });
  test('Government 1 discard and advanced restoration finish before the next turn', () => {
    const client=Client({game:{...OpenStarTerVillage, playerView:({G})=>G, seed:'restore',setup:ctx=>{
      const G=setup(ctx,{ruleset:'tree-poc-v1',forcedFirstEvent:'digital_minister'});
      G.standard!.grown=['government-1']; G.table.scoreBoard['0']=21; return G;
    }},numPlayers:2,playerID:'0'});
    client.start(); client.moves.endActionTurn();
    let s=client.getState()!; expect(s.ctx.activePlayers).toEqual({'0':'standardChoice'});
    expect(s.G.standard!.choices[0].kind).toBe('discard');
    let c=s.G.standard!.choices[0]; client.moves.resolveStandardChoice(c.id,choiceOptions(s.G,c)[0].target);
    s=client.getState()!; c=s.G.standard!.choices[0]; expect(c.kind).toBe('draw');
    client.moves.resolveStandardChoice(c.id,{projectId:'',pile:'advanced'});
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(client.getState()!.G.players['0'].hand.projects.some(p=>p.difficulty>2)).toBe(true);
    client.stop();
  });
});


test('Source 1 and Four Freedoms retain both upgrades even with an exhausted labor deck', () => {
  const G=state(); const c=context(G);
  G.decks.jobs.discardPile.push(...G.decks.jobs.drawPile.splice(0));
  G.table.eventSlot={id:'four',name:'四大自由',description:'',type:'basic',function_name:'add_two_worker_slots'};
  eventCardHandlers.add_two_worker_slots.start(c);
  beginStandardEvent(G);
  expect(G.table.jobSlots).toHaveLength(8);
  expect(G.table.fourFreedomsPendingDiscards).toHaveLength(2);
  growTree(c,'source-1');
  expect(G.table.jobSlots).toHaveLength(10);
  expect(G.rules.table.maxJobSlots).toBe(10);
  eventCardHandlers.add_two_worker_slots.end!(c);
  expect(G.table.jobSlots).toHaveLength(8);
  expect(G.rules.table.maxJobSlots).toBe(8);
});

test('Source 5 permits a second initiation through overtime without a second entitlement', () => {
  const G=state(); G.standard!.grown=['source-5']; syncTreeRules(G);
  G.players['0'].hand.projects=['a','b','c'].map(id=>({id,name:id,type:'ignored',difficulty:1,description:'',requirements:{'工程師':5}}));
  G.table.jobSlots=[{id:'j1',name:'工程師'},{id:'j2',name:'工程師'},{id:'j3',name:'工程師'}];
  createProject(context(G),'a','j1');
  expect(G.players['0'].token.actions).toBe(2);
  expect(validateCreateProject(G,'0','b','j2').valid).toBe(false);
  createProject(context(G),'b','j2',undefined,{useOvertime:true});
  expect(G.players['0'].token.actions).toBe(1);
  expect(validateCreateProject(G,'0','c','j3',undefined,{useOvertime:true}).valid).toBe(false);
});
