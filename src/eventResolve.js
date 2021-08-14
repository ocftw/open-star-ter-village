// @ts-check

/*
Event card: Digital minister without portfolio(數位政委)
            every active worker of respective project type gain 1 contribution
*/
/**
 *
 * @param {Card} card
 */
function allContributionUp(card) {
  let type = '';
  switch (card) {
    case '數位政委：巧遇數位政委，場內所有開放政府專案人力貢獻值+1': {
      type = '開放政府';
      break;
    }
    case '數位政委：巧遇數位政委，場內所有開放原始碼專案人力貢獻值+1': {
      type = '開放原始碼';
      break;
    }
    case '數位政委：巧遇數位政委，場內所有開放資料專案人力貢獻值+1': {
      type = '開放資料';
      break;
    }
    default: {
      // do nothing as default
    }
  }
  // list every project card on table which fits the project type
  const projects = Table.ProjectCard.listProjects();
  // add every worker's contribution by one and avoid exceeding max contribution/project requirements
  const projectShouldUpContributions = projects.filter(project => project.type === type);
  projectShouldUpContributions.forEach(project => {
    if (project.name === '') {
      return;
    }
    project.slots.forEach(slot => {
      if (slot.activeForCurrentPlayer && Table.ProjectCard.isSlotEligibleToContribute(1, project.name, slot.slotId)) {
        Table.ProjectCard.contributeSlot(1, project.name, slot.slotId);
      }
    });
  });
}

/*
Event card: Head hunter(挖角)
            each player draw one card from player sits to their left side(next player)
*/
/** @type {(playerNum: number) => void} */
function drawResourceFromNextPlayer(playerNum) {
  let resourceCards = [];
  let drawCards = [];
  for (let i = 0; i < playerNum; i++){
    //get every active player's hand
    resourceCards[i] = playerHand.getRange(7, i + 1, 8, 1).getValues().filter(x => x[0]);
    //draw a random card from player
    let randomIndex = Math.floor(Math.random() * resourceCards[i].length);
    drawCards[i] = resourceCards[i].splice(randomIndex, 1);
    //sort player's hand
    resourceCards[i] = resourceCards[i].filter(x => x[0]);
  }
  //put card back to player
  for (let i = 0; i < playerNum; i++){
    resourceCards[i].push(drawCards[(i + 1) % playerNum]);
    playerHand.getRange(7, i + 1, resourceCards[i].length, 1).setValues(resourceCards[i]);
  }
}

/*
Event card: Human resource management(人力釋出)
            each player choose one card and give to player sits to their left side(next player)
*/
/** @type {(playerNum: number) => void} */
function passResourceToNextPlayer(playerNum){
  //TODO:let each player choose one card to pass
  //TODO:pass the chosen card for each player
}

/*
Event card: Ketchup technique(番茄醬工作法)
            gain 1 additional contribution to use when player contribute
*/
/**
 * @typedef {Object} bonusContributionToUse
 * @property {() => void} active activate the event effect
 * @property {() => void} deactive deactivate the event effect
*/
/** @type {bonusContributionToUse} */
const bonusContributionToUse = {
  active: () => {
    Rule.contribute.setContribution(Rule.contribute.getContribution() + 1);
  },
  deactive: () => {
    Rule.contribute.setContribution(Rule.contribute.getContribution() - 1);
  }
}

/*
Event card: The four essential freedoms(四大自由)
            draw 1 additional resource card when player refill their hands
*/
/**
 * @typedef {Object} refillOneMoreResource
 * @property {() => void} active activate the event effect
 * @property {() => void} deactive deactivate the event effect
*/
/** @type {refillOneMoreResource} */
const refillOneMoreResource = {
  active: () => {
    Rule.playerHand.resourceCard.setMax(Rule.playerHand.resourceCard.getMax() + 1);
  },
  deactive: () => {
    Rule.playerHand.resourceCard.setMax(Rule.playerHand.resourceCard.getMax() - 1);
  }
}

/*
Event card: Accounting period(會計年度結算)
            project(s) closed in this round gain 2 additional owner score
*/
/**
 * @typedef {Object} bonusOwnerScore
 * @property {() => void} active activate the event effect
 * @property {() => void} deactive deactivate the event effect
*/
/** @type {bonusOwnerScore} */
const bonusOwnerScore = {
  active: () => {
    Rule.settlePhase.setOwnerBonus(Rule.settlePhase.getOwnerBonus() + 2);
  },
  deactive: () => {
    Rule.settlePhase.setOwnerBonus(Rule.settlePhase.getOwnerBonus() - 2);
  }
}

/*
Event card: Global conference(國際交流)
            shuffle and deal all resource card in players' hand
*/
/** @type {(playerNum: number) => void} */
function shuffleAllResource(playerNum) {
  //draw all resource cards from all active players
  let resourceCards = playerHand.getRange(7, 1, 8, playerNum).getValues();
  let cardList = resourceCards.reduce((cards, currentCards) => cards = cards.concat(currentCards.filter(x => x)));
  //shuffle cards
  shuffleArray(cardList);
  let cardNum = cardList.length;
  //add blank space for legitmate setValues function
  if (cardNum % playerNum != 0){
    for (let i =0; i < playerNum - cardNum % playerNum; i++){
      cardList = cardList.concat('');
    }
  }
  //deal cards to player
  let newCardList = [];
  for (let i = 0; i < Math.ceil(cardNum / playerNum); i++) {
    newCardList[i] = cardList.splice(0,playerNum);
  }
  playerHand.getRange(7, 1, 8, playerNum).clearContent();
  playerHand.getRange(7, 1, Math.ceil(cardNum / playerNum), playerNum).setValues(newCardList);
}


/*
Event card: Busy on side hustle(不務正業)
            shuffle and deal all project card in players' hand
*/
/** @type {(playerNum: number) => void} */
function shuffleAllProject(playerNum) {
  //draw all project cards from all active players
  let projectCards = playerHand.getRange(3, 1, 3, playerNum).getValues();
  let cardList = projectCards.reduce((cards, currentCards) => cards = cards.concat(currentCards.filter(x => x)));
  //shuffle cards
  shuffleArray(cardList);
  let cardNum = cardList.length;
  //add blank space for legitmate setValues function
  if (cardNum % playerNum != 0){
    for (let i =0; i < playerNum - cardNum % playerNum; i++){
      cardList = cardList.concat('');
    }
  }
  //deal cards to player
  let newCardList = [];
  for (let i = 0; i < Math.ceil(cardNum / playerNum); i++) {
    newCardList[i] = cardList.splice(0,playerNum);
  }
  playerHand.getRange(3, 1, 3, playerNum).clearContent();
  playerHand.getRange(3, 1, Math.ceil(cardNum / playerNum), playerNum).setValues(newCardList);
}

/*
Event card: Slashie(斜槓青年)
            the first worker recruited can ignore job title restriction in every player's turn
            (which means the first human resource card can be played as a wild card)
*/
/**
 * @typedef {Object} ignoreJobTitleOnFirstWorker
 * @property {() => void} active activate the event effect
 * @property {() => void} deactive deactivate the event effect
*/
/** @type {ignoreJobTitleOnFirstWorker} */
const ignoreJobTitleOnFirstWorker = {
  active: () => {
    Rule.playJobCard.setFirstJobRestriction(false);
  },
  deactive: () => {
    Rule.playJobCard.setFirstJobRestriction(true);
  }
}

/*
Event card: Sorry my liver(抱歉了我的肝)
            the first recruit of every player can recruit 2 worker instead of 1
            (player still need to play respective job card)
*/
/**
 * @typedef {Object} doubleTheRecruit
 * @property {() => void} active activate the event effect
 * @property {() => void} deactive deactivate the event effect
*/
/** @type {doubleTheRecruit} */
const doubleTheRecruit = {
  active: () => {
    Rule.recruit.setRecruitTwiceForOneAP(true);
  },
  deactive: () => {
    Rule.recruit.setRecruitTwiceForOneAP(false);
  }
}

/*
Event card: CO8=D-19 pandemic(猛漢肺炎來襲)
            every active worker lose 1 contribution
*/
function allContributionDown() {
  //TODO: find every project card on table
  //TODO: deduct every worker's contribution by one and avoid minimum contribution
}

/*
Event card: Submarine communications cable get sharkbite!(鯊魚咬斷海底電纜啦！)
            cannot play project card
*/
/**
 * @typedef {Object} cannotPlayProject
 * @property {() => void} active activate the event effect
 * @property {() => void} deactive deactivate the event effect
*/
/** @type {cannotPlayProject} */
const cannotPlayProject = {
  active: () => {
    Rule.playProjectCard.setIsAvailable(false);
  },
  deactive: () => {
    Rule.playProjectCard.setIsAvailable(true);
  }
}

/*
Event card: GitHub under maintenance(GitHub當機啦！)
            cannot contribute
*/
/**
 * @typedef {Object} cannotContribute
 * @property {() => void} active activate the event effect
 * @property {() => void} deactive deactivate the event effect
*/
/** @type {cannotContribute} */
const cannotContribute = {
  active: () => {
    Rule.contribute.setIsAvailable(false);
  },
  deactive: () => {
    Rule.contribute.setIsAvailable(true);
  }
}

/*
Event card: Old and poor(又老又窮啊！)
            cannot play force card
*/
/**
 * @typedef {Object} cannotPlayForce
 * @property {() => void} active activate the event effect
 * @property {() => void} deactive deactivate the event effect
*/
/** @type {cannotPlayForce} */
const cannotPlayForce = {
  active: () => {
    Rule.playForce.setIsAvailable(false);
  },
  deactive: () => {
    Rule.playForce.setIsAvailable(true);
  }
}

/*
Event card: Unpaid leave(減薪休假啊！)
            cannot recruit
*/
/**
 * @typedef {Object} cannotRecruit
 * @property {() => void} active activate the event effect
 * @property {() => void} deactive deactivate the event effect
*/
/** @type {cannotRecruit} */
const cannotRecruit = {
  active: () => {
    Rule.recruit.setIsAvailable(false);
  },
  deactive: () => {
    Rule.recruit.setIsAvailable(true);
  }
}

/*
Event card: Youth subsidy(青年補助)
            the player with least closed projects immediately draw 2 resource cards
            and gain 1 additional action point in this round
*/
function leastClosedProjectBonus(){
  const closedProjectList = Table.Player.listPlayerClosedProjects();
  //find the number of least closed projects
  let leastClosedProject = Infinity;
  closedProjectList.forEach(({ closedProjects }) => {
    if (leastClosedProject > closedProjects) {
      leastClosedProject = closedProjects;
    }
  });
  //list the player(s) with least closed projects
  const leastPlayers = closedProjectList.filter(({ closedProjects }) => closedProjects === leastClosedProject);
  leastPlayers.forEach(({ playerId }) => {
    //the player gain 1 action point for their next turn
    Table.Player.increaseActionPoints(1, playerId);
    //the player draw 2 resource cards
    PlayerHands.dealResourceCardsToPlayerById(ResourceDeck.draw(2), playerId);
  });
}

//shuffle array
function shuffleArray(array){
  let currentIndex = array.length,  randomIndex;
  while (0 !== currentIndex) {
    // Pick a remaining element
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element
    [array[currentIndex], array[randomIndex]]
    = [array[randomIndex], array[currentIndex]];
  }
}

const eventCardFunctionMap = {
  // 數位政委：巧遇數位政委，場內所有開放政府專案人力貢獻值+1
  0: allContributionUp,
  // 數位政委：巧遇數位政委，場內所有開放原始碼專案人力貢獻值+1
  1: allContributionUp,
  // 數位政委：巧遇數位政委，場內所有開放資料專案人力貢獻值+1
  2: allContributionUp,
  // 挖角：每個玩家抽一張左手邊玩家手牌的資源卡
  3: drawResourceFromNextPlayer,
  // 人力釋出：每個玩家傳一張手牌資源卡給左手邊的玩家
  4: passResourceToNextPlayer,
  // 番茄醬工作法：貢獻專案時，可分配的貢獻值+1
  5: bonusContributionToUse,
  // 四大自由：每位玩家補充手牌時可多補一張資源卡
  6: refillOneMoreResource,
  // 會計年度結算：本輪結案的專案，發起者額外獲得 2 點積分
  7: bonusOwnerScore,
  // 國際交流：所有人交出資源牌，洗勻後發回
  8: shuffleAllResource,
  // 不務正業：所有人交出專案牌，洗勻後發回
  9: shuffleAllProject,
  // 斜槓青年：每人第一張打出的人力卡，可以無視人力需求放入專案
  10: ignoreJobTitleOnFirstWorker,
  // 抱歉了我的肝：但我真的想做那個酷專案。每人第一次招募人力時，可用一個行動點招募兩個人力
  11: doubleTheRecruit,
  // 猛漢肺炎來襲：場內所有專案卡的所有人力貢獻值-1
  12: allContributionDown,
  // 鯊魚咬斷海底電纜啦！：本輪不能發起專案
  13: cannotPlayProject,
  // GitHub 當機啦！：本輪不能貢獻專案
  14: cannotContribute,
  // 又老又窮啊！：本輪不能使用源力卡
  15: cannotPlayForce,
  // 減薪休假啊！：本輪不能招募人力
  16: cannotRecruit,
  // 青年補助：目前專案完成數最少的人，立即抽 2 張資源卡，且本回合行動點+1
  17: leastClosedProjectBonus,
};

/**
 *
 * @param {Card} eventCard
 * @returns {Function | { active: Function, deactive: Function }}
 */
function getEventCardFunction(eventCard) {
  const spec = SpreadsheetApp.getActive().getSheetByName('EventCardSpec');
  const cards = spec.getRange(1, 1, 18, 1).getValues().map(row => row[0]);
  const index = cards.findIndex(card => card === eventCard.trim());

  const fn = eventCardFunctionMap[index];
  if (fn === undefined) {
    Logger.log(`Event card ${eventCard} fucntion not found`);
    throw new Error(`Event card ${eventCard} fucntion not found`);
  }
  return fn;
}
