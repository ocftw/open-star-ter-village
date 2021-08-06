// @ts-check

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

/** @type {(playerNum: number) => void} */
//shuffle and deal all resource card in players' hand
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

/** @type {(playerNum: number) => void} */
//shuffle and deal all project card in players' hand
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

/** @type {(playerNum: number) => void} */
//each player draw card(s) from player sits to their left side(next player)
function drawResourceEach(playerNum) {
  
}