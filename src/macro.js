// @ts-check

/** @OnlyCurrentDoc */
const mainBoard = SpreadsheetApp.getActive().getSheetByName('專案圖板/記分板');
const treeBoard = SpreadsheetApp.getActive().getSheetByName('開源生態樹');

//build custom menu
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🌟開源星手村🌟')
    .addItem('準備完成', 'gameWillStart')
    .addSeparator()
    .addItem('重設表單', 'resetSpreadsheet')
    .addSeparator()
    .addItem('Refill Action Points', 'refillActionPoints')
    .addToUi();
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
function gameWillStart() {
  //shuffle before game started
  initialShuffle();
  // deal project cards
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(id => {
    PlayerHands.dealProjectCardsToPlayerById(ProjectDeck.draw(2), id);
  });
  // deal resource cards
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(id => {
    PlayerHands.dealResourceCardsToPlayerById(ResourceDeck.draw(5), id);
  });
  // refill default action points and tokens
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(id => {
    // TODO: replace 3 with rule.actionPoint.default
    Table.Player.setNextTurnActionPoints(3, id);
    Table.Player.setInitWorkerTokens(10, id);
  });

  // everything set, round start
  roundWillStart();
}

function roundWillStart() {
  // draw new event card
  drawEventCard();
  // peek next event card
  peekNextEventCard();

  // everything set, turn start
  turnWillStart();
}

function turnWillStart() { }

function turnDidEnd() {
  // TODO: calculate score
  // TODO: move the open source tree
  // reset and refill current player counters
  Table.Player.resetTurnCounters(CurrentPlayer.getId());
  Table.Player.setNextTurnActionPoints(3, CurrentPlayer.getId());
  // peek next event card
  peekNextEventCard();
  // TODO: move to next player
}

function roundDidEnd() { }

function gameDidEnd() { }

//shuffle before game start
function initialShuffle() {
  ProjectDeck.shuffle();
  ResourceDeck.shuffle();
  EventDeck.shuffle();
  SpreadsheetApp.getActive().toast("已洗勻專案卡、資源卡、事件卡");
};

// set PlayerId and show sidebar
function setPlayerAndShowSidebar(playerId, playerNickname) {
  const currentPlayerId = CurrentPlayer.getId();
  if (currentPlayerId !== playerId) {
    //pop up alert for confirmation
    const response = SpreadsheetApp.getUi()
      .alert('更換玩家', `確定換成${playerNickname}？`, SpreadsheetApp.getUi().ButtonSet.OK_CANCEL);
    if (response === SpreadsheetApp.getUi().Button.CANCEL) {
      SpreadsheetApp.getActive().toast('取消更換玩家');
      return;
    }
    CurrentPlayer.setId(playerId);
    Table.Player.setNickname(playerNickname, playerId);
    SpreadsheetApp.getActive().toast(`已設定為${playerNickname}`);
  }
  showUserSidebar();
}


//bound setPlayerAndShowSidebar function to button
/** @exportedFunction */
function setPlayer1() {
  setPlayerAndShowSidebar('A', '玩家1');
}
/** @exportedFunction */
function setPlayer2() {
  setPlayerAndShowSidebar('B', '玩家2');
}
/** @exportedFunction */
function setPlayer3() {
  setPlayerAndShowSidebar('C', '玩家3');
}
/** @exportedFunction */
function setPlayer4() {
  setPlayerAndShowSidebar('D', '玩家4');
}
/** @exportedFunction */
function setPlayer5() {
  setPlayerAndShowSidebar('E', '玩家5');
}
/** @exportedFunction */
function setPlayer6() {
  setPlayerAndShowSidebar('F', '玩家6');
}


//show sidebar according to playerId
function showUserSidebar() {
  const playerNickname = Table.Player.getNickname(CurrentPlayer.getId());
  const htmlTemplate = HtmlService.createTemplateFromFile('userSidebar');
  htmlTemplate.player = playerNickname;
  const sidebar = htmlTemplate.evaluate().setTitle(playerNickname);
  SpreadsheetApp.getUi().showSidebar(sidebar);
}

function showProjectDialog(cardName) {
  const htmlTemplate = HtmlService.createTemplateFromFile('projectDialog');
  htmlTemplate.cardName = cardName;
  const dialog = htmlTemplate.evaluate();
  SpreadsheetApp.getUi().showModalDialog(dialog, 'project dialog');
}

/**
 * @typedef {Object} Hand player hand cards
 * @property {Card[]} projectCards project cards
 * @property {Card[]} resourceCards resource cards
 */

/**
 * @exportedFunction
 * User can get his/her hand.
 *
 * @type {() => Hand}
 */
function getPlayerCards() {
  const projectCards = CurrentPlayerHand.listProjectCards();
  const resourceCards = CurrentPlayerHand.listResourceCards();
  return {
    projectCards,
    resourceCards,
  };
};

function refillActionPoints() {
  Table.Player.setNextTurnActionPoints(3, CurrentPlayer.getId());
}

/**
 * @exportedFunction
 * User can play one project card with one resource card on the table.
 *
 * @type {(project: Card, resource: Card) => Hand} Return the player project cards after played
 */
function playProjectCard(project, resource) {
  if (!project || !resource) {
    throw new Error('請選擇一張專案卡與一張人力卡！');
  }
  const playerId = CurrentPlayer.getId();
  if (!Table.Player.isActionable(Rule.playProjectCard.getActionPoint(), playerId)) {
    throw new Error('行動點數不足！');
  }
  if (!Table.Player.isRecruitable(playerId)) {
    throw new Error('人力標記不足！');
  }
  if (!Table.ProjectCard.isPlayable()) {
    throw new Error('專案卡欄滿了！');
  }
  // Player does not have valid resource card should throw error
  const slotId = ProjectCardRef.findEligibleSlotId(resource, project);
  if (slotId < 0) {
    throw new Error('沒有適合該人力卡的人力需求！');
  }
  try {
    Table.ProjectCard.play(project);
    const projectCards = CurrentPlayerHand.removeProjectCards([project]);
    const resourceCards = CurrentPlayerHand.removeResourceCards([resource]);
    Table.ProjectCard.placeResourceOnSlotById(project, slotId, playerId, 1, true);
    Table.Player.reduceActionPoint(Rule.playProjectCard.getActionPoint(), playerId);
    Table.Player.reduceWorkerTokens(1, playerId);
    return {
      projectCards,
      resourceCards,
    };
  } catch (err) {
    Logger.log(`playProjectCard failure. ${err}`);
    // fallback
    try {
      Table.ProjectCard.remove(project);
    } catch (err) {
      Logger.log(`playPorjectCard fallback failure. ${err}`);
    }
    throw new Error('something went wrong. Please try again');
  }
}

/** @type {(project: Card) => void} */
function removeProjectCard(project) {
  // TODO: return the resource token to players
  Table.ProjectCard.remove(project);
}

/** @type {(jobCard: Card) => void} */
function recruit(jobCard) {
  // TODO: throw error if not a jobCard
  if (!jobCard) {
    throw new Error('請選擇一張人力卡！');
  }
  const playerId = CurrentPlayer.getId();
  // TODO: replace 1 with rule.recruit.actionPoint
  if (!Table.Player.isActionable(1, playerId)) {
    throw new Error('行動點數不足！');
  }
  if (!Table.Player.isRecruitable(playerId)) {
    throw new Error('人力標記不足！');
  }
  // TODO: has available vacancy slot
  try {
    // open dialog to choose slots
    showProjectDialog(jobCard);
  } catch (err) {
    Logger.log(`recruit failure ${err}`);
    // TODO: fallback
    throw new Error('something went wrong. Please try again');
  }
}

/** @type {(resourceCard: Card, projectCard: Card) => void} */
function playResourceCard(resourceCard, project) {
  // TODO: find project from table
  // TODO: play resource card on project on the table
  // TODO: label resource card owner as player
}

// TODO: rewrite with the table methods
//draw a new event card
function drawEventCard() {
  // get current event card from table
  const currentEventCard = mainBoard.getRange('H20').getDisplayValue();
  if (currentEventCard) {
    // remove current event card from table
    mainBoard.getRange('H20').clearContent();
    // discard current event card to deck
    EventDeck.discard([currentEventCard]);
  }
  // draw event card from deck
  const [newEventCard] = EventDeck.draw();
  // play event card on table
  mainBoard.getRange('H20').setValue(newEventCard);
  SpreadsheetApp.getActive().toast("已翻開新的事件卡");
}

// peek next event card
function peekNextEventCard() {
  // open source tree is level 1
  if (mainBoard.getRange('E11').getValue() > 0) {
    mainBoard.getRange('H21').setValue(SpreadsheetApp.getActive().getSheetByName('EventDeck').getRange('A1').getDisplayValue());
  }
}

/**
 * @exportedFunction
 * User can discard cards and end the turn
 *
 * @type {(projects: Card[], resources: Card[]) => Hand}
 *  return the hand after discarded the cards
 */
function discardCardsAndEndTurn(projects, resources) {
  if (!projects || !resources) {
    throw new Error('Technical issue, please contact author.');
  }
  try {
    let projectCards = [];
    // remove cards from hand to discard pile
    if (projects.length > 0) {
      projectCards = CurrentPlayerHand.removeProjectCards(projects);
      ProjectDeck.discard(projects);
      SpreadsheetApp.getActive().toast(`已經丟棄專案卡${JSON.stringify(projects)}`);
    } else {
      projectCards = CurrentPlayerHand.listProjectCards();
    }

    let resourceCards = [];
    if (resources.length > 0) {
      resourceCards = CurrentPlayerHand.removeResourceCards(resources);
      ResourceDeck.discard(resources);
      SpreadsheetApp.getActive().toast(`已經丟棄資源卡${JSON.stringify(resources)}`);
    } else {
      resourceCards = CurrentPlayerHand.listResourceCards();
    }

    // refill cards from deck pile
    if (projectCards.length < Rule.playerHand.projectCard.getMax()) {
      projectCards = CurrentPlayerHand.addProjectCards(
        ProjectDeck.draw(Rule.playerHand.projectCard.getMax() - projectCards.length));
    }
    if (resourceCards.length < Rule.playerHand.resourceCard.getMax()) {
      resourceCards = CurrentPlayerHand.addResoureCards(
        ResourceDeck.draw(Rule.playerHand.resourceCard.getMax() - resourceCards.length));
    }

    turnDidEnd();

    return {
      projectCards,
      resourceCards,
    };
  } catch (err) {
    Logger.log(`discardCardsAndEndTurn failure. ${err}`);
    // TODO: fallback
    throw new Error('something went wrong. Please try again');
  }
}

/**
 * @exportedFunction
 * Host can reset whole spreadsheet from the custom menu
 *
 * @returns
 */
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

  //clear player properties
  [
    ['A', '玩家1'], ['B', '玩家2'], ['C', '玩家3'],
    ['D', '玩家4'], ['E', '玩家5'], ['F', '玩家6'],
  ].forEach(([playerId, defaultNickname]) => {
    Table.Player.reset(playerId, defaultNickname);
  });

  //clear player hands
  PlayerHands.reset();

  //reset treeBoard display
  treeBoard.getRange('C3:E7').setBackground(null).setFontWeight('normal');

  // reset table
  // reset current event
  mainBoard.getRange('H20').clearContent();
  // reset next event
  mainBoard.getRange('H21').setValue('不顯示');
  //clear project slot and break merged cells
  Table.ProjectCard.reset();

  // reset game rules
  Rule.reset();

  // set UI back to main board
  SpreadsheetApp.getActive().setActiveSheet(mainBoard);
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
