// ts-check

/** @OnlyCurrentDoc */
var spreadsheet = SpreadsheetApp.getActive();
var deck = spreadsheet.getSheetByName('牌庫');
var deckList = spreadsheet.getSheetByName('各牌庫備考');
var playerHand = spreadsheet.getSheetByName('玩家手牌');
//build custom menu
function onOpen(){
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('開源星手村')
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
  const currentEventCard = deck.getRange('F2').getDisplayValue();
  if (currentEventCard) {
    // remove current event card from table
    deck.getRange('F2').clearContent();
    // discard current event card to deck
    EventDeck.discard([currentEventCard]);
  }
  // draw event card from deck
  const [newEventCard] = EventDeck.draw();
  // play event card on table
  deck.getRange('F2').setValue(newEventCard);
}
//reset whole spreadsheet
function resetSpreadsheet() {
  //reset all three decks
  ProjectDeck.reset();
  ResourceDeck.reset();
  EventDeck.reset();
  // reset table
  // TODO: move current event from deck to table
  deck.getRange('F2').clearContent();
  //clear player hands
  playerHand.getRangeList(['A3:F5','A7:F14']).clear();
}