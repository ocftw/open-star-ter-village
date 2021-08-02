// @ts-check

const playerHand = SpreadsheetApp.getActive().getSheetByName('PlayerHand');

/**
 * @typedef {Object} CurrentPlayer current player method to access user property service
 * @property {() => string} getId get player id
 * @property {(playerId: string) => void} setId set player id
 */

/** @type {CurrentPlayer} */
const CurrentPlayer = {
  getId: () => {
    const userProperties = PropertiesService.getUserProperties();
    const playerId = userProperties.getProperty('playerId');
    return playerId;
  },
  setId: (playerId) => {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('playerId', playerId);
  },
};

/**
 * @typedef {Object} CurrentPlayerHand player hand methods
 * @property {() => Card[]} listProjectCards list project cards in the hand
 * @property {(cards: Card[]) => Card[]} removeProjectCards remove project cards and return the rest of project cards
 * @property {(cards: Card[]) => Card[]} addProjectCards add project cards and return all project cards
 * @property {() => Card[]} listResourceCards list resource cards in the hand
 * @property {(cards: Card[]) => Card[]} removeResourceCards remove resource cards and return the rest of resource cards
 * @property {(cards: Card[]) => Card[]} addResoureCards add resource cards and return all resource cards
 */

/** @type {CurrentPlayerHand} */
const CurrentPlayerHand = {
  listProjectCards: () => {
    const playerId = CurrentPlayer.getId();
    return playerHand.getRange(`${playerId}3:${playerId}5`).getValues()
      .map((row) => row[0]).filter(x => x);
  },
  addProjectCards: (cards) => {
    // append cards to the current hand
    const newCards = [...CurrentPlayerHand.listProjectCards(), ...cards];

    const playerId = CurrentPlayer.getId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // save new cards on spreadsheet
    playerHand.getRange(`${playerId}3:${playerId}${3 + newCards.length - 1}`).setValues(values);
    return newCards;
  },
  removeProjectCards: (cards) => {
    // remove cards from the current hand
    const newCards = CurrentPlayerHand.listProjectCards().filter(hand => cards.every(card => hand !== card));

    const playerId = CurrentPlayer.getId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // clean up the spreadsheet and rewrite cards
    playerHand.getRange(`${playerId}3:${playerId}5`).clearContent();
    if (newCards.length > 0) {
      playerHand.getRange(`${playerId}3:${playerId}${3 + newCards.length - 1}`).setValues(values);
    }
    return newCards;
  },
  listResourceCards: () => {
    const playerId = CurrentPlayer.getId();
    return playerHand.getRange(`${playerId}7:${playerId}14`).getValues()
      .map((row) => row[0]).filter(x => x);
  },
  addResoureCards: (cards) => {
    // append cards to the current hand
    const newCards = [...CurrentPlayerHand.listResourceCards(), ...cards];

    const playerId = CurrentPlayer.getId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // save new cards on spreadsheet
    playerHand.getRange(`${playerId}7:${playerId}${7 + newCards.length - 1}`).setValues(values);
    return newCards;
  },
  removeResourceCards: (cards) => {
    // remove cards from the current hand
    const newCards = CurrentPlayerHand.listResourceCards().filter(hand => cards.every(card => hand !== card));

    const playerId = CurrentPlayer.getId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // clean up the spreadsheet and rewrite cards
    playerHand.getRange(`${playerId}7:${playerId}14`).clearContent();
    if (newCards.length > 0) {
      playerHand.getRange(`${playerId}7:${playerId}${7 + newCards.length - 1}`).setValues(values);
    }
    return newCards;
  },
};

/**
 * @typedef {Object} PlayerHands player hands batch operation methods
 * @property {(cards: Card[], playerId: string) => Card[]} dealProjectCardsToPlayerById deal project cards to player and return all project cards
 * @property {(cards: Card[], playerId: string) => Card[]} dealResourceCardsToPlayerById deal resource cards to player and return all resource cards
 * @property {() => void} reset reset all player hands to empty
 */

/** @type {PlayerHands} */
const PlayerHands = {
  dealProjectCardsToPlayerById: (cards, playerId) => {
    const listProjectCardsByPlayerId = (id) => {
      return playerHand.getRange(`${id}3:${id}5`).getValues()
        .map((row) => row[0]).filter(x => x);
    };
    const newCards = [...listProjectCardsByPlayerId(playerId), ...cards];

    // transform the cards
    const values = newCards.map(card => [card]);
    // save new cards on spreadsheet
    playerHand.getRange(`${playerId}3:${playerId}${3 + newCards.length - 1}`).setValues(values);
    return newCards;
  },
  dealResourceCardsToPlayerById: (cards, playerId) => {
    const listResourceCardsByPlayerId = (id) => {
      return playerHand.getRange(`${id}7:${id}14`).getValues()
        .map((row) => row[0]).filter(x => x);
    };
    const newCards = [...listResourceCardsByPlayerId(playerId), ...cards];

    // transform the cards
    const values = newCards.map(card => [card]);
    // save new cards on spreadsheet
    playerHand.getRange(`${playerId}7:${playerId}${7 + newCards.length - 1}`).setValues(values);
    return newCards;
  },
  reset: () => {
    // clear project cards and resource cards
    playerHand.getRangeList(['A3:F5', 'A7:F14']).clear();
  },
};
