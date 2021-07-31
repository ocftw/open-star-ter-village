// @ts-check

var spreadsheet = SpreadsheetApp.getActive();
const defaultDeck = spreadsheet.getSheetByName('各牌庫備考');

/**
 * @typedef {string} Card
 */

/**
 * @typedef {Object} Deck - deck operation on the spread sheet
 * @property {(n?: number) => Card[]} draw - draw n cards from pile
 * @property {(cards: Card[]) => void} discard - discard n cards to discard pile
 * @property {() => void} shuffle - shuffle pile
 * @property {() => void} reset - reset pile and discard pile to default
 */

/** @type {Deck} */
const ProjectDeck = (function () {
  const pile = spreadsheet.getSheetByName('ProjectDeck');
  const draw = (n = 1) => {
    // get number of remaining card
    const remainCardNum = pile.getDataRange().getNumRows();
    // refill pile if remaining cards are not enough
    if (remainCardNum < n) {
      discardPile.getDataRange().randomize().copyTo(pile.getRange(`A${remainCardNum + 1}`));
      discardPile.clearContents();
    }
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
    discardPile.getRange(numOfDiscards + 1, 1, cards.length, 1).setValues(values);
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
    defaultDeck.getRange('A2:A31').copyTo(pile.getRange('A1'));
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
    // get number of remaining card
    const remainCardNum = pile.getDataRange().getNumRows();
    // refill pile if remaining cards are not enough
    if (remainCardNum < n) {
      discardPile.getDataRange().randomize().copyTo(pile.getRange(`A${remainCardNum + 1}`));
      discardPile.clearContents();
    }
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
    discardPile.getRange(numOfDiscards + 1, 1, cards.length, 1).setValues(values);
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
    defaultDeck.getRange('B2:B73').copyTo(pile.getRange('A1'));
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
    discardPile.getRange(numOfDiscards + 1, 1, cards.length, 1).setValues(values);
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
    defaultDeck.getRange('C2:C19').copyTo(pile.getRange('A1'));
  };

  return {
    draw,
    discard,
    reset,
    shuffle,
  };
})();
