import { test, expect } from '@playwright/test';
import { Client, LobbyClient } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { OpenStarTerVillage } from '../src/game/game';
import { choiceOptions } from '../src/game/standard/engine';
import { growthReason, NODES } from '../src/game/standard/tree';
import { validateCreateProject, validateContributeOwnedProjects, validateContributeJoinedProjects } from '../src/game/core/stage/action/validate';
import type { ClientGameState } from '../src/game/store/store';

const server = process.env.PLAYWRIGHT_GAME_SERVER_URL ?? `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3131'}`;
const lobby = new LobbyClient({ server });
const name = 'OpenStarTerVillage';

test('lobby offers Standard with only 2/3/4 seats and rejects forged room requests', async ({ page, request }) => {
  test.skip(process.env.STANDARD_NETWORK_ONLY === '1', 'Network-only verification');
  await page.goto('/lobby');
  await page.getByLabel('遊戲規則', { exact: true }).selectOption('tree-poc-v1');
  const card = page.getByTestId('create-room-card');
  await expect(card.getByRole('button', { name: '2', exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: '4', exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: '5', exact: true })).toHaveCount(0);
  for (const [ruleset, numPlayers] of [['tree-poc-v1', 5], ['unknown',3], ['simple',2]]) {
    const response=await request.post(`${server}/games/${name}/create`,{data:{numPlayers,setupData:{ruleset}}});
    expect(response.status()).toBe(400);
  }
});

for (const count of [2,3,4]) test(`Socket.IO ${count}-player game completes, synchronizes and reconnects`, async () => {
  test.setTimeout(120_000);
  const experiments = { government5: count === 2 ? 'existing' : 'any', completionRewards: count === 3 ? 'fixed' : 'difficulty' };
  const { matchID } = await lobby.createMatch(name,{ numPlayers:count, setupData:{ruleset:'tree-poc-v1',forcedFirstEvent:'digital_minister',experiments} });
  const seats=await Promise.all(Array.from({length:count},async(_,i)=> {
    const joined=await lobby.joinMatch(name,matchID,{playerID:String(i),playerName:`Test ${i+1}`});
    return {id:String(i),credential:joined.playerCredentials};
  }));
  await lobby.updatePlayer(name,matchID,{playerID:'0',credentials:seats[0].credential,data:{started:true}});
  const clients=seats.map(seat=>Client({game:OpenStarTerVillage, multiplayer:SocketIO({server,socketOpts:{transports:['websocket']}}),matchID,playerID:seat.id,credentials:seat.credential}));
  try {
    clients.forEach(c=>c.start());
    await expect.poll(()=>clients.every(c=>c.getState()?.isConnected)).toBe(true);
    clients[1].stop(); clients[1].start();
    await expect.poll(()=>clients[1].getState()?.isConnected).toBe(true);
    let steps=0;
    while (!clients[0].getState()!.ctx.gameover && steps++<250) {
      const state=clients[0].getState()!;
      const choice=state.G.standard!.choices[0];
      const player=choice?.playerId ?? state.ctx.currentPlayer;
      const client=clients[Number(player)];
      const oldId=state._stateID;
      await expect.poll(()=>client.getState()?._stateID).toBe(oldId);
      const G=client.getState()!.G as unknown as ClientGameState;
      if(choice) client.moves.resolveStandardChoice(choice.id,choice.kind==='draw'?choiceOptions(G,choice)[0].target:null);
      else {
        const node=NODES.find(id=>!growthReason(G,id,player));
        const hand=G.players[player].hand!.projects;
        const creation=hand.flatMap(p=>G.table.jobSlots.map(j=>({p,j}))).find(({p,j})=>validateCreateProject(G,player,p.id,j.id).valid);
        const contribution=G.table.projectBoard.flatMap(p=>p.contributions.filter(c=>c.worker===player).map(c=>({projectSlotId:p.id,jobName:c.jobName,value:1}))).find(c=>validateContributeOwnedProjects(G,player,[c]).valid || validateContributeJoinedProjects(G,player,[c]).valid);
        if(node) client.moves.growTree(node);
        else if(creation) client.moves.createProject(creation.p.id,creation.j.id);
        else if(contribution) {
          if(validateContributeOwnedProjects(G,player,[contribution]).valid) client.moves.contributeOwnedProjects([contribution]);
          else client.moves.contributeJoinedProjects([contribution]);
        }
        else if(state.ctx.playOrderPos===count-1 && G.table.fourFreedomsPendingDiscards.length) client.moves.discardExcessJobCards(G.table.jobSlots.slice(0,2).map(c=>c.id));
        else client.moves.endActionTurn();
      }
      await expect.poll(()=>clients[0].getState()?._stateID,{timeout:5000}).toBeGreaterThan(oldId);
      const newId=clients[0].getState()!._stateID;
      await expect.poll(()=>clients.every(c=>c.getState()?._stateID===newId)).toBe(true);
      const boards=clients.map(c=>JSON.stringify(c.getState()!.G.table));
      expect(new Set(boards).size).toBe(1);
      for(let i=0;i<count;i++) {
        expect(clients[i].getState()!.G).not.toHaveProperty('decks');
        expect(clients[i].getState()!.G.players[String((i+1)%count)]).not.toHaveProperty('hand');
      }
    }
    expect(steps).toBeLessThan(250);
    expect(clients[0].getState()!.G.standard!.round).toBe(9-count);
    expect(clients[0].getState()!.G.standard!.experiments).toEqual(experiments);
    const { nextMatchID } = await lobby.playAgain(name, matchID, { playerID: '0', credentials: seats[0].credential, setupData: { ruleset: 'tree-poc-v1', experiments: clients[0].getState()!.G.standard!.experiments } });
    expect((await lobby.getMatch(name, nextMatchID)).setupData.experiments).toEqual(experiments);
  } finally { clients.forEach(c=>c.stop());  }
});


test('Standard board renders and survives a browser refresh', async ({ page }) => {
  test.skip(process.env.STANDARD_NETWORK_ONLY === '1', 'Network-only verification');
  const { matchID } = await lobby.createMatch(name,{numPlayers:2,setupData:{ruleset:'tree-poc-v1'}});
  for (let i=0;i<2;i++) {
    const joined=await lobby.joinMatch(name,matchID,{playerID:String(i),playerName:`UI ${i+1}`});
    if(i===0) {
      await lobby.updatePlayer(name,matchID,{playerID:'0',credentials:joined.playerCredentials,data:{started:true}});
      await page.addInitScript(({matchID,credential})=>localStorage.setItem(`open-star-ter-village.match-credentials.${matchID}`,JSON.stringify({matchID,playerID:'0',credential,playerName:'UI 1'})),{matchID,credential:joined.playerCredentials});
    }
  }
  await page.goto(`/game/${matchID}`);
  await expect(page.getByRole('heading',{name:'標準模式 · 星源樹測試版 v1'})).toBeVisible();
  await page.getByTestId('tree-source-1').click();
  await page.getByRole('button',{name:'確認成長 · 1 AP'}).click();
  await expect(page.getByTestId('tree-source-1')).toContainText('已成長');
  await page.reload();
  await expect(page.getByTestId('tree-source-1')).toContainText('已成長');
  await expect(page.getByTestId('player-status-UI 1')).toHaveAttribute('data-actions','2');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-results/standard-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'test-results/standard-desktop.png',fullPage:true});
  await page.reload();
  await expect(page.getByRole('heading',{name:'標準模式 · 星源樹測試版 v1'})).toBeVisible();
});


test('room experiments persist from creation through waiting room, board, refresh and export', async ({ page, request }) => {
  await page.goto('/lobby');
  await page.getByPlaceholder('你的暱稱').fill('實驗房主');
  await page.getByLabel('遊戲規則', { exact: true }).selectOption('tree-poc-v1');
  await expect(page.getByLabel('政府 5 分配範圍')).toHaveValue('existing');
  await expect(page.getByLabel('發起／結案獎勵')).toHaveValue('fixed');
  await page.getByLabel('政府 5 分配範圍').selectOption('any');
  await expect(page.getByLabel('發起／結案獎勵')).toHaveValue('fixed');
  await page.getByLabel('發起／結案獎勵').selectOption('difficulty');
  await page.getByTestId('create-room-card').getByRole('button', { name: '2', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/experiments-lobby.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/experiments-lobby-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '建立房間 · Create', exact: true }).click();
  await page.waitForURL('**/game/*');
  const matchID = new URL(page.url()).pathname.split('/').pop()!;
  const experiments = { government5: 'any', completionRewards: 'difficulty' };
  expect((await lobby.getMatch(name, matchID)).setupData.experiments).toEqual(experiments);
  await expect(page.getByText(/政府 5：不限既有方塊/)).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/experiments-waiting.png', fullPage: true });
  await lobby.joinMatch(name, matchID, { playerID: '1', playerName: '實驗玩家' });
  await page.getByRole('button', { name: '開始遊戲 · Start game', exact: true }).click();
  await expect(page.getByRole('heading', { name: '標準模式 · 星源樹測試版 v1' })).toBeVisible();
  await page.reload();
  await expect(page.getByText(/政府 5：不限既有方塊/)).toBeVisible();
  await page.screenshot({ path: 'test-results/experiments-board.png', fullPage: true });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '匯出公開測試摘要' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const summary = JSON.parse(Buffer.concat(chunks).toString());
  expect(summary.experiments).toEqual(experiments);
  expect(summary).not.toHaveProperty('telemetry');
  expect(summary).not.toHaveProperty('decks');
  await download.saveAs('test-results/experiments-export.json');
  for (const setupData of [
    { ruleset: 'tree-poc-v1', experiments: { ...experiments, government5: 'everyone' } },
    { ruleset: 'simple', experiments },
  ]) {
    const response = await request.post(`${server}/games/${name}/create`, { data: { numPlayers: 3, setupData } });
    expect(response.status()).toBe(400);
  }
});
