// @ts-check

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
  const pile = SpreadsheetApp.getActive().getSheetByName('ProjectDeck');
  const draw = (n = 1) => {
    // get number of remaining card
    let remainCardNum = pile.getDataRange().getNumRows();
    // number of rows of empty sheet is 1 but it should be 0
    if (remainCardNum === 1 && pile.getRange(1, 1).getValue() === "") {
      remainCardNum = 0;
    }
    // refill pile if remaining cards are not enough
    if (remainCardNum < n) {
      discardPile.getDataRange().randomize().moveTo(pile.getRange(`A${remainCardNum + 1}`));
    }
    // get cards
    const cards = pile.getRange(`A1:A${n}`).getDisplayValues()
      .map(row => row[0]);
    // update card deck
    pile.deleteRows(1, n);
    return cards;
  };
  const discardPile = SpreadsheetApp.getActive().getSheetByName('ProjectDiscardDeck');
  const discard = (cards) => {
    const numOfDiscards = discardPile.getLastRow();
    // update discard deck
    const values = cards.map(card => [card]);
    discardPile.getRange(numOfDiscards + 1, 1, cards.length, 1).setValues(values);
  };
  const shuffle = () => {
    pile.getDataRange().randomize();
  };
  const defaultDeck = SpreadsheetApp.getActive().getSheetByName('教學場各牌庫備考');
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
  const pile = SpreadsheetApp.getActive().getSheetByName('ResourceDeck');
  const draw = (n = 1) => {
    // get number of remaining card
    let remainCardNum = pile.getDataRange().getNumRows();
    // number of rows of empty sheet is 1 but it should be 0
    if (remainCardNum === 1 && pile.getRange(1, 1).getValue() === "") {
      remainCardNum = 0;
    }
    // refill pile if remaining cards are not enough
    if (remainCardNum < n) {
      discardPile.getDataRange().randomize().moveTo(pile.getRange(`A${remainCardNum + 1}`));
    }
    // get cards
    const cards = pile.getRange(`A1:A${n}`).getDisplayValues()
      .map(row => row[0]);
    // update card deck
    pile.deleteRows(1, n);
    return cards;
  };

  const discardPile = SpreadsheetApp.getActive().getSheetByName('ResourceDiscardDeck');
  const discard = (cards) => {
    const numOfDiscards = discardPile.getLastRow();
    // update discard deck
    const values = cards.map(card => [card]);
    discardPile.getRange(numOfDiscards + 1, 1, cards.length, 1).setValues(values);
  };
  const shuffle = () => {
    pile.getDataRange().randomize();
  };
  const defaultDeck = SpreadsheetApp.getActive().getSheetByName('教學場各牌庫備考');
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
  const pile = SpreadsheetApp.getActive().getSheetByName('EventDeck');
  const draw = (n = 1) => {
    // get cards
    const cards = pile.getRange(`A1:A${n}`).getDisplayValues()
      .map(row => row[0]);
    // update card deck
    pile.deleteRows(1, n);
    return cards;
  };

  const discardPile = SpreadsheetApp.getActive().getSheetByName('EventDiscardDeck');
  const discard = (cards) => {
    const numOfDiscards = discardPile.getLastRow();
    // update discard deck
    const values = cards.map(card => [card]);
    discardPile.getRange(numOfDiscards + 1, 1, cards.length, 1).setValues(values);
  };

  const shuffle = () => {
    pile.getDataRange().randomize();
  };
  const defaultDeck = SpreadsheetApp.getActive().getSheetByName('教學場各牌庫備考');
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
