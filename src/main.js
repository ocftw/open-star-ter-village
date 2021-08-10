// @ts-check

/** @OnlyCurrentDoc */

//build custom menu
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🌟開源星手村🌟')
    .addItem('準備完成', 'gameWillStart')
    .addSeparator()
    .addItem('重設表單', 'resetSpreadsheet')
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
  const players = [
    { id: 'A', nickname: '玩家1' }, { id: 'B', nickname: '玩家2' }, { id: 'C', nickname: '玩家3' },
    { id: 'D', nickname: '玩家4' }, { id: 'E', nickname: '玩家5' }, { id: 'F', nickname: '玩家6' },
  ];
  // TODO: set count by dialog
  players.length = 6;
  Table.Player.initPlayers(players);
  //shuffle before game started
  initialShuffle();
  const playerIds = players.map(player => player.id);
  // deal project cards
  playerIds.forEach(id => {
    PlayerHands.dealProjectCardsToPlayerById(ProjectDeck.draw(2), id);
  });
  // deal resource cards
  playerIds.forEach(id => {
    PlayerHands.dealResourceCardsToPlayerById(ResourceDeck.draw(5), id);
  });
  // refill default action points and tokens
  playerIds.forEach(id => {
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
  // everything set, turn start
  turnWillStart();
}

function turnWillStart() {
  // peek next event card
  peekNextEventCard();
}

function turnDidEnd() {
  // reset and refill current player counters
  Table.Player.resetTurnCounters(CurrentPlayer.getId());
  Table.Player.setNextTurnActionPoints(3, CurrentPlayer.getId());
  // move to next player
  const { isStarter } = Table.Player.nextPlayer();
  if (isStarter) {
    // end this round when next player is starter player
    roundDidEnd();
  } else {
    // start the new turn when next plaer is not starter player
    turnWillStart();
  }
}

function roundDidEnd() {
  removeEventCard();
  // TODO: call game did end when the game end
  // start a new round
  roundWillStart();
}

function gameDidEnd() { }

function settlePhase() {
  const closedProjects = Table.ProjectCard.listClosedProjects();
  // Don't settle anything when there is no closed project
  if (closedProjects.length === 0) {
    return;
  }

  const projectStatus = closedProjects.map((project) => {
    // player contributions status sorted by contribution points
    const contributions = Table.ProjectCard.listProjectContributions(project.name);
    const occupancySummary = Table.ProjectCard.listProjectOccupancySummary(project.name);
    return {
      ...project,
      contributions,
      occupancySummary,
    };
  });
  // TODO: calculate score
  // TODO: contribute goal cards
  // Remove projects
  const projectCards = projectStatus.map(project => project.name);
  projectCards.forEach(card => {
    Table.ProjectCard.remove(card);
  });
  // Discard the project cards
  ProjectDeck.discard(projectCards);
  // Return tokens to players
  const playerTokensMap = projectStatus.map(project => project.contributions)
    .reduce((list, row) => ([...list, ...row]), [])
    .reduce((map, contribution) => {
      if (!map[contribution.playerId]) {
        map[contribution.playerId] = 0;
      }
      map[contribution.playerId] += contribution.tokens;
      return map;
    }, {});
  Object.keys(playerTokensMap).forEach(playerId => {
    const tokens = playerTokensMap[playerId];
    Table.Player.increaseWorkerTokens(tokens, playerId);
  });
  // move the open source tree
  const projectTypeCountMap = projectStatus.map(project => project.type).reduce((map, type) => {
    if (!map[type]) {
      map[type] = 0;
    }
    map[type]++;
    return map;
  }, {});
  Table.Tree.upgradeTreeLevels(projectTypeCountMap);
  // trigger tree effects
  const treeLevels = Table.Tree.listTreeLevels();
  treeLevels.forEach(({ type, level }) => {
    switch (type) {
      case '開放資料': {
        switch (level) {
          case 5:
            Rule.playProjectCard.setActionPoint(1);
          case 4:
            Rule.contribute.setContribution(4);
          case 3:
            Rule.playProjectCard.setJobRestriction(false);
          case 2:
          case 1:
            Rule.playerHand.projectCard.setMax(3);
        }
        break;
      }
      case '開放政府': {
        switch (level) {
          case 5:
            Rule.playProjectCard.setActionPoint(1);
          case 4:
            Rule.contribute.setContribution(4);
          case 3:
            Rule.maxProjectSlots.setNum(8);
          case 2:
          case 1:
            Rule.peekNextEvent.setIsAvailable(true);
        }
        break;
      }
      case '開放原始碼': {
        switch (level) {
          case 5:
            Rule.playProjectCard.setActionPoint(1);
          case 4:
            Rule.contribute.setContribution(4);
          case 3:
            Rule.playProjectCard.setInitContributionPoint(3, '工程師');
          case 2:
          case 1:
            Rule.playerHand.resourceCard.setMax(6);
        }
        break;
      }
      default: {
        Logger.log(`unkown tree type ${type}`);
      }
    }
  });
}

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
    if (response === SpreadsheetApp.getUi().Button.OK) {
      CurrentPlayer.setId(playerId);
      Table.Player.setNickname(playerNickname, playerId);
      SpreadsheetApp.getActive().toast(`已設定為${playerNickname}`);
    } else {
      // cancel and close popup
      SpreadsheetApp.getActive().toast('取消更換玩家');
      return;
    }
  }
  showUserSidebar();
}


//bound setPlayerAndShowSidebar function to button
/** @exports */
function setPlayer1() {
  setPlayerAndShowSidebar('A', '玩家1');
}
/** @exports */
function setPlayer2() {
  setPlayerAndShowSidebar('B', '玩家2');
}
/** @exports */
function setPlayer3() {
  setPlayerAndShowSidebar('C', '玩家3');
}
/** @exports */
function setPlayer4() {
  setPlayerAndShowSidebar('D', '玩家4');
}
/** @exports */
function setPlayer5() {
  setPlayerAndShowSidebar('E', '玩家5');
}
/** @exports */
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

function showProjectDialog(playerNickname) {
  const dialog = HtmlService.createHtmlOutputFromFile('projectDialog');
  dialog.setHeight(360);
  dialog.setWidth(1280);
  SpreadsheetApp.getUi().showModalDialog(dialog, `${playerNickname}正在貢獻專案`);
}

/**
 * @typedef {Object} Hand player hand cards
 * @property {Card[]} projectCards project cards
 * @property {Card[]} resourceCards resource cards
 */

/**
 * User can get his/her hand.
 *
 * @exports getPlayerCards
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

/**
 * User can play one project card with one resource card on the table.
 *
 * @exports playProjectCard
 * @type {(project: Card, resource: Card) => Hand} Return the player project cards after played
 */
function playProjectCard(project, resource) {
  if (!Table.Player.isInTurn(CurrentPlayer.getId())) {
    throw new Error('這不是你的回合！');
  }
  if (!Rule.playProjectCard.getIsAvailable()) {
    throw new Error('海底電纜還沒修好，不能發起專案！');
  }
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

/**
 *
 * @exports listAvailableProjectByJob
 * @param {Card} jobCard
 * @returns {{name: string, slotId: number}[]}
 */
function listAvailableProjectByJob(jobCard) {
  if (!Table.Player.isInTurn(CurrentPlayer.getId())) {
    throw new Error('這不是你的回合！');
  }
  if (!Rule.recruit.getIsAvailable()) {
    throw new Error('減薪休假中，不能招募人力！');
  }
  if (!jobCard || resourceCardRef.isForceCard(jobCard)) {
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
  const vacancies = Table.ProjectCard.listAvailableProjectByJob(jobCard, 1);
  if (vacancies.length === 0) {
    throw new Error('沒有適合的職缺！');
  }
  PropertiesService.getUserProperties().setProperty('LISTED_JOB', jobCard);
  return vacancies;
}

/**
 *
 * @exports recruit
 * @param {Card} project
 * @param {number} slotId
 * @returns {Hand}
 */
function recruit(project, slotId) {
  if (!Table.Player.isInTurn(CurrentPlayer.getId())) {
    throw new Error('這不是你的回合！');
  }
  const jobCard = PropertiesService.getUserProperties().getProperty('LISTED_JOB');
  if (!jobCard) {
    Logger.log('recruit failure. Cannot find jobCard from properties service');
    throw new Error('something went wrong. Please try again');
  }
  try {
    const projectCards = CurrentPlayerHand.listProjectCards();
    const resourceCards = CurrentPlayerHand.removeResourceCards([jobCard]);
    const playerId = CurrentPlayer.getId();
    Table.ProjectCard.placeResourceOnSlotById(project, slotId, playerId, 1);
    Table.Player.reduceActionPoint(1, playerId);
    Table.Player.reduceWorkerTokens(1, playerId);

    return {
      projectCards,
      resourceCards,
    }
  } catch (err) {
    Logger.log(`recruit failure. ${err}`);
    // TODO: fallback
    throw new Error('something went wront. Please try again');
  }
}

/**
 *
 * @exports openContributeDialog
 */
function openContributeDialog() {
  if (!Table.Player.isInTurn(CurrentPlayer.getId())) {
    throw new Error('這不是你的回合！');
  }
  if (!Rule.contribute.getIsAvailable()) {
    throw new Error('GitHub當機中，不能貢獻專案！');
  }
  if (!Table.Player.isActionable(1, CurrentPlayer.getId())) {
    throw new Error('行動點數不足！');
  }
  // TODO: check available contribution slots
  try {
    showProjectDialog(Table.Player.getNickname(CurrentPlayer.getId()));
  } catch (err) {
    Logger.log(`openContributeDialog failure. ${err}`);
    throw new Error('something went wrong. Please try again');
  }
}

/**
 * list all projects on the table and max is the max contribution point player can add
 *
 * @exports listProjects
 * @returns {{ projects: Project[], maxContribution: number }}
 */
function listProjects() {
  if (!Table.Player.isInTurn(CurrentPlayer.getId())) {
    throw new Error('這不是你的回合！');
  }
  return {
    maxContribution: Rule.contribute.getContribution(),
    projects: Table.ProjectCard.listProjects(CurrentPlayer.getId()),
  };
}

/**
 * @typedef {Object} Contribution
 * @property {string} project project name
 * @property {number} slotId slot index of project
 * @property {number} points contribution points to the slot
 */

/**
 *
 * @exports contribute
 * @param {Contribution[]} contributionList
 */
function contribute(contributionList) {
  if (!Table.Player.isInTurn(CurrentPlayer.getId())) {
    throw new Error('這不是你的回合！');
  }
  const sum = contributionList.reduce((s, contribution) => s + contribution.points, 0);
  if (sum > Rule.contribute.getContribution()) {
    throw new Error('超過分配點數上限！');
  }
  const playerId = CurrentPlayer.getId();
  if (!Table.Player.isActionable(1, playerId)) {
    throw new Error('行動點數不足！');
  }
  const isBelongingToPlayer = contributionList
    .map(contribution => Table.ProjectCard.isPlayerEligibleToContributeSlot(playerId, contribution.project, contribution.slotId))
    .every(x => x);
  if (!isBelongingToPlayer) {
    throw new Error('無法分配給不屬於自己的專案/人力！');
  }
  const isAvailableToContribute = contributionList.map(contribution =>
    Table.ProjectCard.isSlotEligibleToContribute(
      contribution.points, contribution.project, contribution.slotId)
  ).every(x => x);
  if (!isAvailableToContribute) {
    throw new Error('無法分配超過目標上限！');
  }
  try {
    contributionList.forEach(contribution => {
      Table.ProjectCard.contributeSlot(contribution.points, contribution.project, contribution.slotId);
    });
    Table.Player.reduceActionPoint(1, playerId);
  } catch (err) {
    Logger.log(`contribute failure. ${err}`);
    // TODO: fallback
    throw new Error('something went wrong. Please try again');
  }
}

/**
 * Player can play force card and resolve the effect
 *
 * @exports playForceCard
 * @param {Card} forceCard
 * @param {Card?} projectCard
 * @returns {Hand}
 */
function playForceCard(forceCard, projectCard = null) {
  if (!Table.Player.isInTurn(CurrentPlayer.getId())) {
    throw new Error('這不是你的回合！');
  }
  if (!Rule.playForce.getIsAvailable()) {
    throw new Error('本輪不能使用源力卡，可憐哪！');
  }
  if (!forceCard || !resourceCardRef.isForceCard(forceCard)) {
    throw new Error('請選擇一張源力卡！');
  }
  const playerId = CurrentPlayer.getId();
  // TODO: replace 1 with rule.playForce.actionPoint
  if (!Table.Player.isActionable(1, playerId)) {
    throw new Error('行動點數不足！');
  }
  try {
    const resourceCards = CurrentPlayerHand.removeResourceCards([forceCard]);
    // TODO: resolve force card
    Table.Player.reduceActionPoint(1, CurrentPlayer.getId());
    ResourceDeck.discard([forceCard]);
    const projectCards = CurrentPlayerHand.listProjectCards();
    return {
      projectCards,
      resourceCards,
    }
  } catch (err) {
    Logger.log(`playForceCard failure. ${err}`);
    // TODO: fallback
    throw new Error('something went wrong. Please try again');
  }
}

//draw a new event card
function drawEventCard() {
  // draw event card from deck
  const [card] = EventDeck.draw();
  // play event card on table
  Table.EventCard.place(card);
  // TODO: apply event card effect
  SpreadsheetApp.getActive().toast("已翻開新的事件卡");
}

function removeEventCard() {
  // remove event card from table
  const card = Table.EventCard.remove();
  // TODO: reverse event card effect when needed
  // discard it to the pile
  EventDeck.discard([card]);
}

// peek next event card
function peekNextEventCard() {
  if (Rule.peekNextEvent.getIsAvailable()) {
    const peekNext = SpreadsheetApp.getActive().getSheetByName('EventDeck').getRange('A1').getDisplayValue();
    Table.EventCard.showNext(peekNext);
  }
}

/**
 * User can discard cards and end the turn
 *
 * @exports discardCardsAndEndTurn
 * @type {(projects: Card[], resources: Card[]) => Hand}
 *  return the hand after discarded the cards
 */
function discardCardsAndEndTurn(projects, resources) {
  if (!Table.Player.isInTurn(CurrentPlayer.getId())) {
    throw new Error('這不是你的回合！');
  }
  if (!projects || !resources) {
    throw new Error('Technical issue, please contact author.');
  }

  // close projects, return tokens to players, earn scores, and grow the open source tree
  settlePhase();

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
 * Host can reset whole spreadsheet from the custom menu
 *
 * @exports resetSpreadsheet
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
  Table.Player.reset();

  //clear player hands
  PlayerHands.reset();

  // reset table
  // reset event cards
  Table.EventCard.reset();
  //clear project slot and break merged cells
  Table.ProjectCard.reset();
  //reset tree
  Table.Tree.reset();

  // reset game rules
  Rule.reset();

  // set UI back to main board
  SpreadsheetApp.getActive().setActiveSheet(SpreadsheetApp.getActive().getSheetByName('專案圖板/記分板'));
  SpreadsheetApp.getActive().toast("已重設表單");
}
