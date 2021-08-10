//@ts-check

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
 * @returns {Function}
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
function gainOneAPNextRound() {
  //TODO: finish the card effect
}

/*
Force card: Help my project senpai(開坑救救我)
            gain contribution according to number of project you owned on board
            (you can distribute freely)
*/
function gainContributionByOwnedProject() {
  //TODO: check how many project on table was owned by current player
  //TODO: switch to contribution dialog and finish contribute
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
/** @type {(playerId: string) => void} */
function tradeResourceCards(playerId) {
  //TODO: trade all cards with respective player according to playerId
}

/*
Force card: Pincer movement(鉗形攻勢)
            inspect the next two event cards and put them back in any order
*/
function peekNextTwoEventCardAndChange() {
  //TODO: peek next two event card
  //TODO: ask player whether they want to change the event order
}
