// @ts-check

/** @OnlyCurrentDoc */
var spreadsheet = SpreadsheetApp.getActive();
const projectCardsBoard = spreadsheet.getSheetByName('專案卡列表');
const tableProjectCard = spreadsheet.getSheetByName('TableProjectCard');
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
    .addItem('顯示玩家手牌', 'showUserSidebar')
    .addItem('測試ProjectCard', 'testProjectCards')
    .addToUi();
}

// set PlayerId and show sidebar
function setPlayerAndShowSidebar(playerId, playerNickname) {
  const currentPlayerId = Player.getId();
  if (currentPlayerId !== playerId) {
    //pop up alert for confirmation
    const response = SpreadsheetApp.getUi()
      .alert('更換玩家', `確定換成${playerNickname}？`, SpreadsheetApp.getUi().ButtonSet.OK_CANCEL);
    if (response === SpreadsheetApp.getUi().Button.CANCEL) {
      SpreadsheetApp.getActive().toast('取消更換玩家');
      return;
    }
    Player.setId(playerId);
    Player.setNickname(playerNickname);
    SpreadsheetApp.getActive().toast(`已設定為${playerNickname}`);
  }
  showUserSidebar();
}


//bound setPlayerAndShowSidebar function to button
function setPlayer1() {
  setPlayerAndShowSidebar('A', '玩家1');
}

function setPlayer2() {
  setPlayerAndShowSidebar('B', '玩家2');
}

function setPlayer3() {
  setPlayerAndShowSidebar('C', '玩家3');
}

function setPlayer4() {
  setPlayerAndShowSidebar('D', '玩家4');
}

function setPlayer5() {
  setPlayerAndShowSidebar('E', '玩家5');
}

function setPlayer6() {
  setPlayerAndShowSidebar('F', '玩家6');
}


//show sidebar according to playerId
function showUserSidebar() {
  const playerNickname = Player.getNickname();
  const htmlTemplate = HtmlService.createTemplateFromFile('userSidebar');
  htmlTemplate.player = playerNickname;
  const sidebar = htmlTemplate.evaluate().setTitle(playerNickname);
  SpreadsheetApp.getUi().showSidebar(sidebar);
}

//shuffle before game start
function initialShuffle() {
  ProjectDeck.shuffle();
  ResourceDeck.shuffle();
  EventDeck.shuffle();
  SpreadsheetApp.getActive().toast("已洗勻專案卡、資源卡、事件卡");
};

/** @type {(n?: number) => void} */
function drawProjectCards(n) {
  // draw cards from deck
  const projectCards = ProjectDeck.draw(n);
  // TODO: distribute cards to player hand
  // playerBoard(player).insertProjectCard(projectCards);
}

/** @type {(projects: Card[]) => void} */
function discardProjectCards(projects) {
  ProjectDeck.discard(projects);
  SpreadsheetApp.getActive().toast(`玩家${Player.getNickname()}已經丟棄專案卡${JSON.stringify(projects)}`);
}

/**
 * @typedef {Object} ProjectCard
 * @property {() => number} getMax get maximum project card on table
 * @property {(max: number) => void} setMax set maximum project card on table
 * @property {() => number} getCount get number of project cards on table
 * @property {() => boolean} isPlayable whether table is able to placed a project card
 * @property {(card: Card) => void} play play a project card on table
 * @property {(card: Card) => void} remove remove a project card on table
 * @property {(projectCard: Card, resourceCard: Card) => void} placeResourceCard place a resource card on the project
 */

/** @type {ProjectCard} */
const ProjectCard = {
  getMax: () => tableProjectCard.getRange('B1').getValue(),
  setMax: (max) => {
    tableProjectCard.getRange('B1').setValue(max);
  },
  getCount: () => tableProjectCard.getRange('B2').getValue(),
  isPlayable: () => ProjectCard.getMax() > ProjectCard.getCount(),
  play: (card) => {
    const cards = tableProjectCard.getRange(11, 1, ProjectCard.getMax(), 1).getValues().map(row => row[0]);
    const emptyIdx = cards.findIndex(c => !c);
    if (emptyIdx < 0) {
      Logger.log('Cannot find project card slot on table');
      throw new Error('Cannot find project card slot on table');
    }
    // set card data on hidden board
    tableProjectCard.getRange(11 + emptyIdx, 1).setValue(card);
    // increament the project card count
    tableProjectCard.getRange('B2').setValue(ProjectCard.getCount() + 1);

    // render card on table
    // find card range from default deck
    const findCardRange = (card) => {
      const idx = defaultDeck.getRange('A2:A31').getDisplayValues().map(row => row[0]).findIndex(c => c === card);
      if (idx > -1) {
        const row = idx % 10;
        const column = Math.floor(idx / 10);
        return projectCardsBoard.getRange(9 * row + 1, 5 * column + 1, 9, 5);
      }
      Logger.log('failed to find project card' + card);
      return null;
    };
    const cardRange = findCardRange(card);

    // find table range to paste the card
    const row = emptyIdx % 2;
    const col = Math.floor(emptyIdx / 2);
    const tableRange = mainBoard.getRange(2 + 9 * row, 7 + 5 * col, 9, 5);

    if (cardRange !== null) {
      cardRange.copyTo(tableRange);
    }
  },
  remove: (card) => {
    const cards = tableProjectCard.getRange(11, 1, ProjectCard.getMax(), 1).getValues().map(row => row[0]);
    const cardIdx = cards.findIndex(c => c === card);
    if (cardIdx < 0) {
      Logger.log(`Cannot find project card ${card} on table`);
      throw new Error(`Cannot find project card ${card} on table`);
    }
    // remove card data on hidden board
    tableProjectCard.getRange(11 + cardIdx, 1).clearContent();
    // decreament the project card count
    tableProjectCard.getRange('B2').setValue(ProjectCard.getCount() - 1);

    // render card on table
    const defaultCardRange = tableProjectCard.getRange('D1:H9');
    // find table range to paste the default card
    const row = cardIdx % 2;
    const col = Math.floor(cardIdx / 2);
    const tableRange = mainBoard.getRange(2 + 9 * row, 7 + 5 * col, 9, 5);

    defaultCardRange.copyTo(tableRange);
  },
  placeResourceCard: () => { },
};

const Table = {
  ProjectCard,
};

/** @type {(project: Card) => void} */
function playProjectCard(project) {
  if (Table.ProjectCard.isPlayable()) {
    Table.ProjectCard.play(project);
  }
  // TODO: label project owner as player
}

/** @type {(project: Card) => void} */
function removeProjectCard(project) {
  // TODO: return the resource token to players
  Table.ProjectCard.remove(project);
}

/** @type {(n?: number) => void} */
function drawResourceCards(n) {
  // draw cards from deck
  const resourceCards = ResourceDeck.draw(n);
  // TODO: distriubte cards to player hand
  // playerBoard(player).insertResourceCard(resourceCards);
}

/** @type {(resourceCards: Card[]) => void} */
function discardResourceCards(resourceCards) {
  ResourceDeck.discard(resourceCards);
  SpreadsheetApp.getActive().toast(`玩家${Player.getNickname()}已經丟棄資源卡${JSON.stringify(resourceCards)}`);
}

/** @type {(resourceCard: Card, projectCard: Card) => void} */
function playResourceCard(resourceCard, project) {
  // TODO: find project from table
  // TODO: play resource card on project on the table
  // TODO: label resource card owner as player
}

function testProjectCards() {
  playProjectCard('OCF Lab');
  playProjectCard('Firebox');
  removeProjectCard('OCF Lab');
  playProjectCard('資料申請小精靈');
  removeProjectCard('Firebox');
  removeProjectCard('資料申請小精靈');
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

// export functions for sidebar
/** @type {() => Hand} */
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
  PlayerHands.reset();

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

function treeChange(e) {
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
