// ts-check

/** @OnlyCurrentDoc */
var spreadsheet = SpreadsheetApp.getActive();
var deckList = spreadsheet.getSheetByName('各牌庫備考');
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
    .addToUi();
}

/**
 * @typedef {any} Card
 */

/**
 * @typedef {Object} Deck - deck operation on the spread sheet
 * @property {(n: number) => Card[]} draw - draw n cards from pile
 * @property {(cards: Card[]) => void} discard - discard n cards to discard pile
 * @property {() => void} shuffle - shuffle pile
 * @property {() => void} reset - reset pile and discard pile to default
 */

/** @type {Deck} */
const ProjectDeck = (function () {
  const pile = spreadsheet.getSheetByName('ProjectDeck');
  const draw = (n = 1) => {
    // get cards
    const cards = pile.getRange(`A1:A${n}`).getDisplayValues()
      .map(row => row[0]);
    // update card deck
    pile.deleteRows(1, n);
    return cards;
  };
  const discardPile = spreadsheet.getSheetByName('ProjectDiscardDeck');
  const discard = (cards) => {
    const numOfDiscards = discardPile.getLastRow();
    // update discard deck
    const values = cards.map(card => [card]);
    discardPile.getRange(`A${numOfDiscards + 1}`).setValues(values);
  };
  const shuffle = () => {
    pile.getDataRange().randomize();
  };
  const reset = () => {
    // clear discard pile
    discardPile.clearContents();
    // clear pile
    pile.clearContents();
    // set pile as default pile
    deckList.getRange('A2:A31').copyTo(pile.getRange('A1'));
  };

  return {
    draw,
    discard,
    reset,
    shuffle,
  };
})();

/** @type {Deck} */
const ResourceDeck = (function () {
  const pile = spreadsheet.getSheetByName('ResourceDeck');
  const draw = (n = 1) => {
    // get cards
    const cards = pile.getRange(`A1:A${n}`).getDisplayValues()
      .map(row => row[0]);
    // update card deck
    pile.deleteRows(1, n);
    return cards;
  };

  const discardPile = spreadsheet.getSheetByName('ResourceDiscardDeck');
  const discard = (cards) => {
    const numOfDiscards = discardPile.getLastRow();
    // update discard deck
    const values = cards.map(card => [card]);
    discardPile.getRange(`A${numOfDiscards + 1}`).setValues(values);
  };
  const shuffle = () => {
    pile.getDataRange().randomize();
  };
  const reset = () => {
    // clear discard pile
    discardPile.clearContents();
    // clear pile
    pile.clearContents();
    // set pile as default pile
    deckList.getRange('B2:B73').copyTo(pile.getRange('A1'));
  };

  return {
    draw,
    discard,
    reset,
    shuffle,
  };
})();

/** @type {Deck} */
const EventDeck = (function () {
  const pile = spreadsheet.getSheetByName('EventDeck');
  const draw = (n = 1) => {
    // get cards
    const cards = pile.getRange(`A1:A${n}`).getDisplayValues()
      .map(row => row[0]);
    // update card deck
    pile.deleteRows(1, n);
    return cards;
  };

  const discardPile = spreadsheet.getSheetByName('EventDiscardDeck');
  const discard = (cards) => {
    const numOfDiscards = discardPile.getLastRow();
    // update discard deck
    const values = cards.map(card => [card]);
    discardPile.getRange(`A${numOfDiscards + 1}`).setValues(values);
  };

  const shuffle = () => {
    pile.getDataRange().randomize();
  };
  const reset = () => {
    // clear discard pile
    discardPile.clearContents();
    // clear pile
    pile.clearContents();
    // set pile as default pile
    deckList.getRange('C2:C19').copyTo(pile.getRange('A1'));
  };

  return {
    draw,
    discard,
    reset,
    shuffle,
  };
})();

//shuffle before game start
function initialShuffle() {
  ProjectDeck.shuffle();
  ResourceDeck.shuffle();
  EventDeck.shuffle();
  SpreadsheetApp.getActive().toast("已洗勻專案卡、資源卡、事件卡");
};

/** @type {(player: Player, n?: number) => void} */
function drawProjectCards(player, n) {
  // draw cards from deck
  const projectCards = ProjectDeck.draw(n);
  // TODO: distribute cards to player hand
  // playerBoard(player).insertProjectCard(projectCards);
}

/** @type {(player: Player, n?: number) => void} */
function drawResourceCards(player, n) {
  // draw cards from deck
  const resourceCards = ResourceDeck.draw(n);
  // TODO: distriubte cards to player hand
  // playerBoard(player).insertResourceCard(resourceCards);
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

//reset whole spreadsheet
function resetSpreadsheet() {
  //pop up alert for confirmation
  response = SpreadsheetApp.getUi()
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
