// @ts-check

/*
Event card: Digital minister without portfolio(數位政委)
            every active worker of respective project type gain 1 contribution
*/
/** @type {(projectType: string) => void} */
function allContributionUp(projectType) {
  //TODO: find every project card on table which fits the project type
  //TODO: add every worker's contribution by one and avoid exceeding max contribution/project requirements
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
  var playerList = ['A', 'B', 'C', 'D', 'E', 'F'];
  //TODO: find the player with least closed projects
  //TODO: the player draw 2 resource cards
  //TODO: the player gain 1 action point for their next turn
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