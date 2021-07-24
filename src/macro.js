// @ts-check

/** @OnlyCurrentDoc */
var spreadsheet = SpreadsheetApp.getActive();
const playerHand = spreadsheet.getSheetByName('PlayerHand');
const mainBoard = spreadsheet.getSheetByName('專案圖板/記分板');
const treeBoard = spreadsheet.getSheetByName('開源生態樹');

//build custom menu
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🌟開源星手村🌟')
    .addItem('開場洗牌', 'initialShuffle')
    .addItem('翻事件卡', 'drawEventCard')
    .addSeparator()
    .addItem('重設表單', 'resetSpreadsheet')
    .addSeparator()
    .addItem('顯示玩家1手牌', 'showUserSidebar')
    .addToUi();
}

//set PlayerId with button
function setPlayer1() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('playerId', 'A');
  SpreadsheetApp.getActive().toast('已設定為玩家1');
}

function setPlayer2() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('playerId', 'B');
  SpreadsheetApp.getActive().toast('已設定為玩家2');
}

function setPlayer3() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('playerId', 'C');
  SpreadsheetApp.getActive().toast('已設定為玩家3');
}

function setPlayer4() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('playerId', 'D');
  SpreadsheetApp.getActive().toast('已設定為玩家4');
}

function setPlayer5() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('playerId', 'E');
  SpreadsheetApp.getActive().toast('已設定為玩家5');
}

function setPlayer6() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('playerId', 'F');
  SpreadsheetApp.getActive().toast('已設定為玩家6');
}


//show sidebar according to playerId
function showUserSidebar() {
  const playerId = getPlayerId();
  const htmlTemplate = HtmlService.createTemplateFromFile('userSidebar');
  htmlTemplate.player = playerHand.getRange(`${playerId}1`).getDisplayValue();
  const sidebar = htmlTemplate.evaluate().setTitle(playerHand.getRange(`${playerId}1`).getDisplayValue());
  SpreadsheetApp.getUi().showSidebar(sidebar);
}

//shuffle before game start
function initialShuffle() {
  ProjectDeck.shuffle();
  ResourceDeck.shuffle();
  EventDeck.shuffle();
  SpreadsheetApp.getActive().toast("已洗勻專案卡、資源卡、事件卡");
};

/** @typedef {string} Player */

/** @type {(player: Player, n?: number) => void} */
function drawProjectCards(player, n) {
  // draw cards from deck
  const projectCards = ProjectDeck.draw(n);
  // TODO: distribute cards to player hand
  // playerBoard(player).insertProjectCard(projectCards);
}

/** @type {(projects: Card[], player: Player) => void} */
function discardProjectCards(projects, player) {
  ProjectDeck.discard(projects);
  SpreadsheetApp.getActive().toast(`玩家${player}已經丟棄專案卡${JSON.stringify(projects)}`);
}

/** @type {(project: Card, player: Player) => void} */
function playProjectCard(project, player) {
  // TODO: place project card on the table
  // TODO: label project owner as player
}

/** @type {(player: Player, n?: number) => void} */
function drawResourceCards(player, n) {
  // draw cards from deck
  const resourceCards = ResourceDeck.draw(n);
  // TODO: distriubte cards to player hand
  // playerBoard(player).insertResourceCard(resourceCards);
}

/** @type {(resourceCards: Card[], player: Player) => void} */
function discardResourceCards(resourceCards, player) {
  ResourceDeck.discard(resourceCards);
  SpreadsheetApp.getActive().toast(`玩家${player}已經丟棄資源卡${JSON.stringify(resourceCards)}`);
}

/** @type {(resourceCard: Card, projectCard: Card, player: Player) => void} */
function playResourceCard(resourceCard, project, player) {
  // TODO: find project from table
  // TODO: play resource card on project on the table
  // TODO: label resource card owner as player
}

//draw a new event card
function drawEventCard() {
  // get current event card from table
  const currentEventCard = mainBoard.getRange('G20').getDisplayValue();
  if (currentEventCard) {
    // remove current event card from table
    mainBoard.getRange('G20').clearContent();
    // discard current event card to deck
    EventDeck.discard([currentEventCard]);
  }
  // draw event card from deck
  const [newEventCard] = EventDeck.draw();
  // play event card on table
  mainBoard.getRange('G20').setValue(newEventCard);
  SpreadsheetApp.getActive().toast("已翻開新的事件卡");
}

// peek next event card
function peekNextEventCard() {
  // open source tree is level 1
  if (mainBoard.getRange('D11').getValue() > 0) {
    mainBoard.getRange('G21').setValue(spreadsheet.getSheetByName('EventDeck').getRange('A1').getDisplayValue());
  }
}

/**
 * Game cycle design inspected by react component life cycle
 * Game cycle
 * game will start
 * > round 1
 *   round will start
 *   > player 1
 *     turn will start
 *     player 1 actions
 *     turn did end
 *   > player 2
 *     turn will start
 *     player 2 actions
 *     turn did end
 *   > ... and so on
 *   round did end
 * > ... and so on
 * game did end
 */
function gameWillStart() { }

function roundWillStart() {
  // draw new event card
  drawEventCard();
  // peek next event card
  peekNextEventCard();
}

function turnWillStart() { }

function turnDidEnd() {
  // peek next event card
  peekNextEventCard();
}

function roundDidEnd() { }

function gameDidEnd() { }

/**
 * @typedef {Object} Hand player hand cards
 * @property {Card[]} projectCards project cards
 * @property {Card[]} resourceCards resource cards
 */

/**
 * @typedef {Object} PlayerHand player hand methods
 * @property {() => Card[]} listProjectCards list project cards in the hand
 * @property {(cards: Card[]) => Card[]} removeProjectCards remove project cards and return the rest of project cards
 * @property {(cards: Card[]) => Card[]} addProjectCards add project cards and return all project cards
 * @property {() => Card[]} listResourceCards list resource cards in the hand
 * @property {(cards: Card[]) => Card[]} removeResourceCards remove resource cards and return the rest of resource cards
 * @property {(cards: Card[]) => Card[]} addResoureCards add resource cards and return all resource cards
 */

function getPlayerId() {
  const userProperties = PropertiesService.getUserProperties();
  const playerId = userProperties.getProperty('playerId');
  return playerId;
}

/** @type {PlayerHand} */
const PlayerHand = {
  listProjectCards: () => {
    const playerId = getPlayerId();
    return playerHand.getRange(`${playerId}3:${playerId}5`).getValues()
      .map((row) => row[0]).filter(x => x);
  },
  addProjectCards: (cards) => {
    // append cards to the current hand
    const newCards = [PlayerHand.listProjectCards(), ...cards];

    const playerId = getPlayerId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // save new cards on spreadsheet
    playerHand.getRange(`${playerId}3`).setValues(values);
    return newCards;
  },
  removeProjectCards: (cards) => {
    // remove cards from the current hand
    const newCards = PlayerHand.listProjectCards().filter(hand => cards.every(card => hand !== card));

    const playerId = getPlayerId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // clean up the spreadsheet and rewrite cards
    playerHand.getRange(`${playerId}3:${playerId}5`).clearContent();
    playerHand.getRange(`${playerId}3`).setValues(values);
    return newCards;
  },
  listResourceCards: () => {
    const playerId = getPlayerId();
    return playerHand.getRange(`${playerId}7:${playerId}14`).getValues()
      .map((row) => row[0]).filter(x => x);
  },
  addResoureCards: (cards) => {
    // append cards to the current hand
    const newCards = [PlayerHand.listResourceCards(), ...cards];

    const playerId = getPlayerId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // save new cards on spreadsheet
    playerHand.getRange(`${playerId}7`).setValues(values);
    return newCards;
  },
  removeResourceCards: (cards) => {
    // remove cards from the current hand
    const newCards = PlayerHand.listResourceCards().filter(hand => cards.every(card => hand !== card));

    const playerId = getPlayerId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // clean up the spreadsheet and rewrite cards
    playerHand.getRange(`${playerId}7:${playerId}14`).clearContent();
    playerHand.getRange(`${playerId}7`).setValues(values);
    return newCards;
  },
}

// export function for
function getPlayerCards() {
  const projectCards = PlayerHand.listProjectCards();
  const resourceCards = PlayerHand.listResourceCards();
  return {
    projectCards,
    resourceCards,
  };
};

//reset whole spreadsheet
function resetSpreadsheet() {
  //pop up alert for confirmation
  const response = SpreadsheetApp.getUi()
    .alert("⚠️確定重整表單？", "目前的遊戲進度會全部刪除", SpreadsheetApp.getUi().ButtonSet.OK_CANCEL);
  if (response === SpreadsheetApp.getUi().Button.CANCEL) {
    SpreadsheetApp.getActive().toast("已取消重設表單");
    return;
  }

  //reset all three decks
  ProjectDeck.reset();
  ResourceDeck.reset();
  EventDeck.reset();

  //clear player hands
  playerHand.getRangeList(['A3:F5', 'A7:F14']).clear();

  //reset treeBoard display
  treeBoard.getRange('C3:E7').setBackground(null).setFontWeight('normal');

  // reset table
  // reset current event
  mainBoard.getRange('G20').clearContent();
  // reset next event
  mainBoard.getRange('G21').setValue('不顯示');
  //reset left column
  mainBoard.getRangeList(['C3:C8', 'D10:D12']).setValue('0');
  mainBoard.getRange('D3:D8').setValue('10');
  //clear project slot and break merged cells
  mainBoard.getRangeList([
    'B14:B24',
    'G2:G3', 'I2:J3', 'G5:J10', 'G11:G12', 'I11:J12', 'G14:J19',
    'L2:L3', 'N2:O3', 'L5:O10', 'L11:L12', 'N11:O12', 'L14:O19',
    'Q2:Q3', 'S2:T3', 'Q5:T10', 'Q11:Q12', 'S11:T12', 'Q14:T19',
    'V2:V3', 'X2:Y3', 'V5:Y10', 'V11:V12', 'X11:Y12', 'V14:Y19',
  ]).clear({ contentsOnly: true }).breakApart();
  mainBoard.getRangeList([
    'F5:F10', 'K5:K10',
    'P5:P10', 'U5:U10',
    'F14:F19', 'K14:K19',
    'P14:P19', 'U14:U19',
  ]).setValue(false);
  //change the color of 7th and 8th project slot
  mainBoard.getRangeList(['U2:Y3', 'U4:Y10', 'U11:Y12', 'U13:Y19'])
    .setFontColor("grey")
    .setBorder(true, null, true, true, null, null, "grey", SpreadsheetApp.BorderStyle.DASHED);

  // set UI back to main board
  spreadsheet.setActiveSheet(mainBoard);
  SpreadsheetApp.getActive().toast("已重設表單");
}

function onEdit(e) {
  //TODO:maybe revise code mechanics to prevent use of onEdit?
  //update treeBoard
  switch (e.range.getA1Notation()) {
    case 'D10':
      treeBoard.getRange('C2').offset(1, 0, e.value, 1)
        .setBackground('#d9ead3').setFontWeight('bold');
      break;
    case 'D11':
      treeBoard.getRange('D2').offset(1, 0, e.value, 1)
        .setBackground('#d9ead3').setFontWeight('bold');
      if (e.value > 2) {
        //open up project slot at open government level 3
        mainBoard.getRange('U2:Y19').setFontColor("black");
        mainBoard.getRangeList(['U2:Y3', 'U11:Y12'])
          .setBorder(null, null, true, null, null, null, 'black', SpreadsheetApp.BorderStyle.SOLID);
        mainBoard.getRangeList(['U2:Y10', 'U11:Y19'])
          .setBorder(true, null, true, true, null, null, 'black', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      };
      if (e.value > 3) {
        //change background color of level 4 and 5
        treeBoard.getRange('C6').offset(0, 0, e.value - 3, 1)
          .setBackground('#d9ead3').setFontWeight('bold');
      };
      break;
    case 'D12':
      treeBoard.getRange('E2').offset(1, 0, e.value, 1)
        .setBackground('#d9ead3').setFontWeight('bold');
      if (e.value > 3) {
        //change background color of level 4 and 5
        treeBoard.getRange('C6').offset(0, 0, e.value - 3, 1)
          .setBackground('#d9ead3').setFontWeight('bold');
      };
      break;
  }
}
