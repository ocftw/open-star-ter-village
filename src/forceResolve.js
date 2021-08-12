//@ts-check

/*
Force card: Project subsidy(專案補助)
            put this card under a project card, that project gain +5 owner score
*/
/** @type {(project: string) => void} */
function projectOwnerScoreBonus(project) {
  //TODO: find the corresponding project on project board
  //TODO: add the +5 owner score bonus to the project
  //TODO: change the project UI to show the force effect is active
}

/*
Force card: Cloud storage(雲端硬碟)
            put this card under a project card, that project cannot lose contribution
*/
/** @type {(project: string) => void} */
function projectContributionProtection(project) {
  //TODO: find the corresponding project on project board
  //TODO: change the project state to prevent contribution lost
  //TODO: change the project UI to show the force effect is active
}

/*
Force card: Open definition/Open-source license/Opening of open era(開放定義/開源授權/開放元年)
            play two project of corresponding type (job card is still required to play)
*/
/** @type {(project: string) => void} */
function playTwoSameTypeProject(project) {
  //TODO: finish the card effect
}

/*
Force card: Teach me opensource senpai(開源教教我)
            play two job cards immediately(need to match job requirement of project on board)
*/
/** @type {(job1: string, job2?: string) => void} */
function playTwoJobCards(job1, job2) {
  //TODO: finish the card effect
}

/*
Force card: Power squat(累積深蹲之力)
            put this card in front of you(current player), gain +1 action point on your next turn
            discard this card after your next turn ends
*/
const gainOneAPNextRound = {
  active: (card, playerId) => {
    Table.Player.increaseActionPointsRefill(1, playerId);
    Table.Player.addCardInfront(card, playerId);
  },
  deactive: (card, playerId) => {
    Table.Player.decreaseActionPointsRefill(1, playerId);
    Table.Player.removeCardInfront(card, playerId);
    ResourceDeck.discard([card]);
  },
};

/*
Force card: Help my project senpai(開坑救救我)
            gain contribution according to number of project you owned on board
            (you can distribute freely)
*/
function gainContributionByOwnedProject(card, playerId) {
  //TODO: check how many project on table was owned by current player
  const ownedProjects = Table.ProjectCard.listOwnedProjectsByOwnerId(playerId);
  const count = ownedProjects.length;
  //TODO: switch to contribution dialog and finish contribute
  PropertiesService.getScriptProperties().setProperty('CONTRIBUTE_TOKEN', `${playerId}__${count}`);
  showProjectDialog(count);
}

/*
Force card: Work with me senpai(入坑揪揪我)
            gain contribution according to number of project you joined on board
            (you can distribute freely)
*/
function gainContributionByJoinedProject() {
  //TODO: check how many project on table was joined by current player
  //TODO: switch to contribution dialog and finish contribute
}

/*
Force card: Zero transfer(零的轉移)
            choose two slots on one project, reduce contribution of these slot to 1
            choose another project to gain those contribution
*/
/** @type {(donorProject: string, recipientProject: string) => void} */
function contributionTransferBetweenProject(donorProject, recipientProject) {
  //TODO: finish card effect
}

/*
Force card: Personnel change(人事異動)
            trade all resource cards with another player
*/
/** @type {(currentPlayerId: string, targetPlayerId) => void} */
function tradeResourceCards(currentPlayerId) {
  //get target player ID by prompt
  var targetPlayerId;
  while(1) {
    const ui = SpreadsheetApp.getUi();
    var result = ui.prompt('人事異動','請輸入要交換手牌的玩家編號(1~6)',SpreadsheetApp.getUi().ButtonSet.OK);
    var button = result.getSelectedButton();
    var text = result.getResponseText();
    if (button === ui.Button.OK) {
      const num = Number.parseInt(text, 10);
      const id = ['A','B','C','D','E','F'];
      if (Number.isInteger(num) && 0 < num && num <= Table.Player.getPlayerCount() && id[num-1] != currentPlayerId) {
        targetPlayerId = id[num - 1];
        break;
      }
      ui.alert('請輸入正確的玩家編號！');
    }
  }
  //get current player and target player hands
  const currentPlayerRange = playerHand.getRange(`${currentPlayerId}7:${currentPlayerId}14`);
  const targetPlayerRange = playerHand.getRange(`${targetPlayerId}7:${targetPlayerId}14`);
  const currentResource = currentPlayerRange.getDisplayValues();
  const targetResource = targetPlayerRange.getDisplayValues();
  //clear range
  currentPlayerRange.clearContent();
  targetPlayerRange.clearContent();
  //set values to spreadsheet
  currentPlayerRange.setValues(targetResource);
  targetPlayerRange.setValues(currentResource);
  const targetPlayerName = Table.Player.getNickname(targetPlayerId);
  SpreadsheetApp.getActive().toast(`已成功和${targetPlayerName}交換手牌`,'人事異動');
}

/*
Force card: Pincer movement(鉗形攻勢)
            inspect the next two event cards and put them back in any order
*/
function peekNextTwoEventCardAndChange() {
  const eventDeck = SpreadsheetApp.getActive().getSheetByName('EventDeck');
  //get next two event card values
  const nextTwoEvent = eventDeck.getRange('A1:A2').getDisplayValues().map(x => x[0]);
  const ui = SpreadsheetApp.getUi();
  if (nextTwoEvent[0] == ''){
    ui.alert('鉗形攻勢','目前場上是最後一張事件卡了',ui.ButtonSet.OK);
  } else if (nextTwoEvent[1] == ''){
    ui.alert('鉗形攻勢',`下一張事件卡是：\n${nextTwoEvent[0]}\n沒有其他事件卡了`,ui.ButtonSet.OK);
  } else {
    //ask player whether they want to change the event order
    const result = ui.alert('鉗形攻勢',
    `接下來兩張事件卡是：\n${nextTwoEvent[0]}\n${nextTwoEvent[1]}\n要交換事件順序嗎？`
    ,ui.ButtonSet.YES_NO);
    if (result === ui.Button.YES) {
      eventDeck.getRange('A1').setValue(nextTwoEvent[1]);
      eventDeck.getRange('A2').setValue(nextTwoEvent[0]);
      SpreadsheetApp.getActive().toast(`已成功交換事件順序`,'鉗形攻勢');
    }
  }
}

const functionMap = {
  // 專案補助：放置在專案牌下，該專案結算時，專案發起者積分額外 +5
  0: projectOwnerScoreBonus,
  // 雲端硬碟：放置在專案牌下，該專案不會被扣除貢獻值
  1: projectContributionProtection,
  // 開放定義：立刻打出兩張開放原始碼專案（仍需打出人力卡）
  2: playTwoSameTypeProject,
  // 開源授權：立刻打出兩張開放資料專案（仍需打出人力卡）
  3: playTwoSameTypeProject,
  // 開放元年：立刻打出兩張開放政府專案（仍需打出人力卡）
  4: playTwoSameTypeProject,
  // 開源教教我：立刻打出兩張符合場上人力需求的人力卡
  5: playTwoJobCards,
  // 累積深蹲之力：打出後放置在自己面前，下回合行動點+1，下回合結束後再將此卡放進棄牌堆
  6: gainOneAPNextRound,
  // 開坑救救我：立即增加等同於場上自己發起專案數量的貢獻值，可自行分配
  7: gainContributionByOwnedProject,
  // 入坑揪揪我：立即增加等同於場上有自己人力指示物的專案數量的貢獻值，可自行分配
  8: gainContributionByJoinedProject,
  // 零的轉移：選擇任一專案兩欄貢獻值，將其下降到 1 點，選擇另一個專案增加下降的總貢獻值
  9: contributionTransferBetweenProject,
  // 人事異動：和另一位玩家交換所有資源卡（人力和源力卡）
  10: tradeResourceCards,
  // 鉗形攻勢：偷看事件牌庫頂兩張卡片，並以任意順序放回牌庫頂
  11: peekNextTwoEventCardAndChange,
};

/**
 *
 * @param {Card} forceCard
 * @returns {Function | { active: Function, deactive: Function }}
 */
function getForceCardFunction(forceCard) {
  const spec = SpreadsheetApp.getActive().getSheetByName('ForceCardSpec');
  const cards = spec.getRange(1, 1, 12, 1).getValues().map(row => row[0]);
  const index = cards.findIndex(card => card === forceCard);

  const fn = functionMap[index];
  if (fn === undefined) {
    Logger.log(`Force card ${forceCard} fucntion not found`);
    throw new Error(`Force card ${forceCard} fucntion not found`);
  }
  return fn;
}
