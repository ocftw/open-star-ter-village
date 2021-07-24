// @ts-check

var spreadsheet = SpreadsheetApp.getActive();
var playerHand = spreadsheet.getSheetByName('PlayerHand');

/**
 * @typedef {Object} Player player methods
 * @property {() => string} getId get player id
 * @property {(playerId: string) => void} setId set player id
 * @property {() => string} getNickname get player nickname
 * @property {(nickname) => void} setNickname set player nick name
 */
/** @type {Player} */
const Player = {
  getId: () => {
    const userProperties = PropertiesService.getUserProperties();
    const playerId = userProperties.getProperty('playerId');
    return playerId;
  },
  setId: (playerId) => {
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('playerId', playerId);
  },
  getNickname: () => {
    return playerHand.getRange(`${Player.getId()}1`).getDisplayValue();
  },
  setNickname: (nickname) => {
    playerHand.getRange(`${Player.getId()}1`).setValue(nickname);
  },
};

/**
 * @typedef {Object} PlayerHand player hand methods
 * @property {() => Card[]} listProjectCards list project cards in the hand
 * @property {(cards: Card[]) => Card[]} removeProjectCards remove project cards and return the rest of project cards
 * @property {(cards: Card[]) => Card[]} addProjectCards add project cards and return all project cards
 * @property {() => Card[]} listResourceCards list resource cards in the hand
 * @property {(cards: Card[]) => Card[]} removeResourceCards remove resource cards and return the rest of resource cards
 * @property {(cards: Card[]) => Card[]} addResoureCards add resource cards and return all resource cards
 */

/** @type {PlayerHand} */
const PlayerHand = {
  listProjectCards: () => {
    const playerId = Player.getId();
    return playerHand.getRange(`${playerId}3:${playerId}5`).getValues()
      .map((row) => row[0]).filter(x => x);
  },
  addProjectCards: (cards) => {
    // append cards to the current hand
    const newCards = [PlayerHand.listProjectCards(), ...cards];

    const playerId = Player.getId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // save new cards on spreadsheet
    playerHand.getRange(`${playerId}3`).setValues(values);
    return newCards;
  },
  removeProjectCards: (cards) => {
    // remove cards from the current hand
    const newCards = PlayerHand.listProjectCards().filter(hand => cards.every(card => hand !== card));

    const playerId = Player.getId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // clean up the spreadsheet and rewrite cards
    playerHand.getRange(`${playerId}3:${playerId}5`).clearContent();
    playerHand.getRange(`${playerId}3`).setValues(values);
    return newCards;
  },
  listResourceCards: () => {
    const playerId = Player.getId();
    return playerHand.getRange(`${playerId}7:${playerId}14`).getValues()
      .map((row) => row[0]).filter(x => x);
  },
  addResoureCards: (cards) => {
    // append cards to the current hand
    const newCards = [PlayerHand.listResourceCards(), ...cards];

    const playerId = Player.getId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // save new cards on spreadsheet
    playerHand.getRange(`${playerId}7`).setValues(values);
    return newCards;
  },
  removeResourceCards: (cards) => {
    // remove cards from the current hand
    const newCards = PlayerHand.listResourceCards().filter(hand => cards.every(card => hand !== card));

    const playerId = Player.getId();
    // transform the cards
    const values = newCards.map(card => [card]);
    // clean up the spreadsheet and rewrite cards
    playerHand.getRange(`${playerId}7:${playerId}14`).clearContent();
    playerHand.getRange(`${playerId}7`).setValues(values);
    return newCards;
  },
};
