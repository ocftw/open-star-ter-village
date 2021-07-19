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
 * @typedef {string[]} Card
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
  const draw = (n = 1) => { };
  const discard = (cards) => { };
  const shuffle = () => {
    deck.getRange('A2:A31').randomize();
  };
  const reset = () => {
    // clear discard pile
    deck.getRange('B2:B31').clearContent();
    // clear pile
    deck.getRange('A2:A31').clearContent();
    // set pile as default pile
    deckList.getRange('A2:A31').copyTo(deck.getRange('A2:A31'));
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
  const draw = (n = 1) => { };
  const discard = (cards) => { };
  const shuffle = () => {
    deck.getRange('C2:C73').randomize();
  };
  const reset = () => {
    // clear discard pile
    deck.getRange('D2:D73').clearContent();
    // clear pile
    deck.getRange('C2:C73').clearContent();
    // set pile as default pile
    deckList.getRange('B2:B73').copyTo(deck.getRange('C2:C73'));
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
  let numOfCards = 18;
  const draw = (n = 1) => {
    // out of cards
    if (n > numOfCards) {
      return [];
    }
    // get cards
    const cards = deck.getRange(`E2:E${1 + n}`).getDisplayValues()
      .map(row => row[0]);
    // update card deck
    deck.getRange(`E${2 + n}:E${1 + numOfCards}`).moveTo('E2');
    // update numOfCards
    numOfCards -= n;
    return cards;
  };

  let numOfDiscards = 0;
  const discard = (cards) => {
    // update discard deck
    const values = cards.map(card => [card]);
    deck.getRange(`E${2 + numOfDiscards}`).setValues(values);
    numOfDiscards += cards.length;
  };

  const shuffle = () => {
    deck.getRange('E2:E19').randomize();
  };
  const reset = () => {
    // clear discard pile
    deck.getRange('G2:G19').clearContent();
    // clear pile
    deck.getRange('E2:E19').clearContent();
    // set pile as default pile
    deckList.getRange('C2:C19').copyTo(deck.getRange('E2:E19'));
    numOfCards = 18;
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