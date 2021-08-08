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
Event card: Human resource management(人力釋出)
            each player draw card(s) from player sits to their left side(next player)
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
Event card: Side project(不務正業)
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
Event card: CO8=D-19 pandemic(猛漢肺炎來襲)
            every active worker lose 1 contribution
*/
function allContributionDown() {
  //TODO: find every project card on table 
  //TODO: deduct every worker's contribution by one and avoid minimum contribution
}

/*
Event card: Youth subsidy(青年補助)
            the player with least closed projects immediately draw 2 resource cards 
            and gain 1 additional action point in this round
*/
function leastClosedProjectBonus(){
  
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