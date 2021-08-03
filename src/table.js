// @ts-check

/**
 * The method collection to play card, remove card, update score, ... etc. from/on the table.
 * Each property represent a disjoint functionality includes data store and main board rendering update
 * @typedef {object} TableController
 * @property {TableProjectCardController} ProjectCard project card methods includes play, isPlayable, place
 * @property {TablePlayerController} Player player methods
 *
 * @typedef {Object} TableProjectCardController
 * @property {() => boolean} isPlayable whether table is able to placed a project card
 * @property {(card: Card) => void} play play a project card on table
 * @property {(card: Card) => void} remove remove a project card on table
 * @property {() => void} reset remove all project cards and reset max slots
 * @property {(n: number) => void} activateNSlots activate N project card slots on table
 * @property {(projectCard: Card, slotIdx: number, playerId: string, initialPoints: number,
 *  isOwner?: boolean) => void} placeResourceOnSlotById place an arbitrary resource card on the project slot by slot index
 *  with initial contribution points
 *
 * @typedef {Object} TablePlayerController
 * @property {(playerId: string) => string} getNickname get player nickname
 * @property {(nickname, playerId: string) => void} setNickname set player nick name
 * @property {(cost: number, playerId: string) => boolean} isActionable return whether player has action points more than cost
 * @property {(cost: number, playerId: string) => number} reduceActionPoint reduce action points on player
 * @property {(playerId: string) => boolean} isRecruitable
 * @property {(cost: number, playerId: string) => number} reduceWorkerTokens
 * @property {(tokens: number, playerId: string) => number} increaseWorkerTokens
 * @property {(nextTurnPoints: number, playerId: string) => void} setNextTurnActionPoints
 * @property {(initTokens: number, playerId: string) => void} setInitWorkerTokens
 * @property {(score: number, playerId: string) => number} earnScore
 * @property {(playerId: string) => void} resetTurnCounters
 * @property {(playerId: string, defaultNickname: string) => void} reset
 */

/** @type {TableController} */
const Table = (() => {
  const defaultDeck = SpreadsheetApp.getActive().getSheetByName('各牌庫備考');
  const mainBoard = SpreadsheetApp.getActive().getSheetByName('專案圖板/記分板');

  // table project card view
  const projectCardsBoard = SpreadsheetApp.getActive().getSheetByName('專案卡列表');
  const ProjectCardView = {
    // find card template range from default deck
    findCardTemplateRange: (card) => {
      const idx = defaultDeck.getRange('A2:A31').getDisplayValues().map(row => row[0]).findIndex(c => c === card);
      if (idx < 0) {
        Logger.log('failed to find project card range' + card);
        throw new Error('failed to find render project card range');
      }
      const row = idx % 10;
      const column = Math.floor(idx / 10);
      return projectCardsBoard.getRange(9 * row + 1, 5 * column + 1, 9, 5);
    },
    // find card range on table
    findTableRangeById: (id) => {
      const row = id % 2;
      const col = Math.floor(id / 2);
      return mainBoard.getRange(2 + 9 * row, 7 + 5 * col, 9, 5);
    },
    setPlayerOnTableSlotById: (playerNickname, id, slotId, isOwner = false) => {
      const range = ProjectCardView.findTableRangeById(id);
      range.offset(3 + slotId, 1, 1, 1).setValue(playerNickname);
      range.offset(3 + slotId, 0, 1, 1).setValue(isOwner);
    },
    setContributionPointOnTableSlotById: (points, id, slotId) => {
      const range = ProjectCardView.findTableRangeById(id);
      range.offset(3 + slotId, 4, 1, 1).setValue(points);
    },
  };

  // table project card model
  const tableProjectCard = SpreadsheetApp.getActive().getSheetByName('TableProjectCard');
  const ProjectCardModel = {
    getMax: () => tableProjectCard.getRange('B1').getValue(),
    setMax: (max) => {
      tableProjectCard.getRange('B1').setValue(max);
    },
    getCount: () => tableProjectCard.getRange('B2').getValue(),
    setCount: (count) => tableProjectCard.getRange('B2').setValue(count),
    findEmptyId: () => {
      const cards = tableProjectCard.getRange(11, 1, ProjectCardModel.getMax(), 1).getValues().map(row => row[0]);
      const idx = cards.findIndex(c => !c);
      if (idx < 0) {
        Logger.log('Cannot find project card slot on table');
        throw new Error('Cannot find project card slot on table');
      }
      return idx;
    },
    findCardId: (card) => {
      const cards = tableProjectCard.getRange(11, 1, ProjectCardModel.getMax(), 1).getValues().map(row => row[0]);
      const idx = cards.findIndex(c => c === card);
      if (idx < 0) {
        Logger.log(`Cannot find project card ${card} on table`);
        throw new Error(`Cannot find project card ${card} on table`);
      }
      return idx;
    },
    /** @type {(spec: ProjectCardSpecObject, id: number) => void} */
    addCardSpecById: (spec, id) => {
      Logger.log(`add card spec by id ${id}`);
      // set basis info
      const basicInfoRow = [spec.name, spec.type];
      tableProjectCard.getRange(11 + id, 1, 1, 2).setValues([basicInfoRow]);

      // set slots info
      const slotInfoRows = spec.groups.map((group, idx) => {
        const row = [group.title, /* palyerId */, /* points */, idx];
        return [...new Array(group.slots)].map(_ => row);
      }).reduce((rows, slotRows) => [...rows, ...slotRows], []);
      tableProjectCard.getRange(21 + 10 * id, 1, 6, 4).setValues(slotInfoRows);

      // set groups info
      const groupInfoRows = spec.groups.map((group) => {
        const row = [group.title, /* current */, group.goalContributionPoints];
        return row;
      });
      tableProjectCard.getRange(21 + 10 * id, 5, spec.groups.length, 3).setValues(groupInfoRows);
      // increament the project card count
      ProjectCardModel.setCount(ProjectCardModel.getCount() + 1);
    },
    removeCardById: (id) => {
      // clear name, type, owner, and exts. 4 is the ext buffers
      tableProjectCard.getRange(11 + id, 1, 1, 3 + 4).clearContent();
      // clear slots info
      tableProjectCard.getRange(21 + 10 * id, 1, 6, 4).clearContent();
      // clear groups info
      tableProjectCard.getRange(21 + 10 * id, 5, 6, 3).clearContent();
      // decreament the project card count
      ProjectCardModel.setCount(ProjectCardModel.getCount() - 1);
    },
    removeAllCards: () => {
      // clear name, type, owner, and exts. 4 is the ext buffers
      tableProjectCard.getRange(11, 1, ProjectCardModel.getMax(), 3 + 4).clearContent();
      [...new Array(ProjectCardModel.getMax() - 0)].map((_, i) => i + 0).forEach((id) => {
        // clear slots info
        tableProjectCard.getRange(21 + 10 * id, 1, 6, 4).clearContent();
        // clear groups info
        tableProjectCard.getRange(21 + 10 * id, 5, 6, 3).clearContent();
      });
      ProjectCardModel.setCount(0);
    },
    getProjectTypeById: (id) => tableProjectCard.getRange(11 + id, 2).getValue(),
    setProjectTypeById: (type, id) => tableProjectCard.getRange(11 + id, 2).setValue(type),
    getProjectOnwerById: (id) => tableProjectCard.getRange(11 + id, 3).getValue(),
    setProjectOnwerById: (ownerId, id) => tableProjectCard.getRange(11 + id, 3).setValue(ownerId),
    setPlayerOnSlotById: (playerId, id, slotId) => {
      if (tableProjectCard.getRange(21 + 10 * id + slotId, 2).getValue()) {
        Logger.log(`Slot ${slotId} on card ${id} is occupied`);
        throw new Error(`Slot ${slotId} on card ${id} is occupied`);
      }
      tableProjectCard.getRange(21 + 10 * id + slotId, 2).setValue(playerId);
    },
    getContributionPointOnSlotById: (id, slotId) => tableProjectCard.getRange(21 + 10 * id + slotId, 3).getValue(),
    setContributionPointOnSlotById: (points, id, slotId) => tableProjectCard.getRange(21 + 10 * id + slotId, 3).setValue(points),
    getDefaultCardRange: () => tableProjectCard.getRange('D1:H9'),
    getDeactiveCardRange: () => tableProjectCard.getRange('J1:N9'),
  };

  /** @type {TableProjectCardController} */
  const ProjectCard = (() => {
    const isPlayable = () => ProjectCardModel.getMax() > ProjectCardModel.getCount();
    const play = (card) => {
      const cardSpec = ProjectCardRef.getSpecByCard(card);
      const emptyIdx = ProjectCardModel.findEmptyId();
      // set card data on hidden board
      ProjectCardModel.addCardSpecById(cardSpec, emptyIdx);

      // render card on table
      const cardRange = ProjectCardView.findCardTemplateRange(card);
      // find table range to paste the card
      const tableRange = ProjectCardView.findTableRangeById(emptyIdx);
      cardRange.copyTo(tableRange);
    };
    const remove = (card) => {
      const cardIdx = ProjectCardModel.findCardId(card);
      // remove card data on hidden board
      ProjectCardModel.removeCardById(cardIdx);

      // render card on table
      const defaultCardRange = ProjectCardModel.getDefaultCardRange();
      // find table range to paste the default card
      const tableRange = ProjectCardView.findTableRangeById(cardIdx);

      defaultCardRange.copyTo(tableRange);
    };
    const reset = () => {
      // reset rendering
      [0, 1, 2, 3, 4, 5].map(ProjectCardView.findTableRangeById).forEach(range => {
        ProjectCardModel.getDefaultCardRange().copyTo(range);
      });
      [6, 7].map(ProjectCardView.findTableRangeById).forEach(range => {
        ProjectCardModel.getDeactiveCardRange().copyTo(range);
      });
      // reset cards
      ProjectCardModel.removeAllCards();
      // reset max
      ProjectCardModel.setMax(6);
    };
    const activateNSlots = (n) => {
      const currentMax = ProjectCardModel.getMax();
      if (n > currentMax) {
        // activate slots
        [...new Array(n - currentMax)].map((_, i) => i + currentMax)
          .map(ProjectCardView.findTableRangeById).forEach(range => {
            ProjectCardModel.getDefaultCardRange().copyTo(range);
          });
      }
      if (n < currentMax) {
        // deactivate slots
        [...new Array(currentMax - n)].map((_, i) => i + n)
          .map(ProjectCardView.findTableRangeById).forEach(range => {
            ProjectCardModel.getDeactiveCardRange().copyTo(range);
          });
      }
      // update maximum
      ProjectCardModel.setMax(n);
    };
    const placeResourceOnSlotById = (project, slotId, playerId, initialPoints, isOwner = false) => {
      const cardId = ProjectCardModel.findCardId(project);
      // set player on slot
      ProjectCardModel.setPlayerOnSlotById(playerId, cardId, slotId);
      // set initial contribution point
      ProjectCardModel.setContributionPointOnSlotById(initialPoints, cardId, slotId);
      // TODO: add contribution point to group
      if (isOwner) {
        ProjectCardModel.setProjectOnwerById(playerId, cardId);
      }
      Logger.log(`player ${playerId} occupy slot ${slotId} on project ${project} on data table`);

      // render on table
      // set player on slot
      ProjectCardView.setPlayerOnTableSlotById(PlayerModel.getNickname(playerId), cardId, slotId, isOwner);
      // set initial contribution point
      ProjectCardView.setContributionPointOnTableSlotById(initialPoints, cardId, slotId);
      Logger.log(`render the player ${playerId} takes slot ${slotId} on project ${project} on table`);
    };

    return {
      isPlayable,
      play,
      remove,
      reset,
      activateNSlots,
      placeResourceOnSlotById,
    };
  })();

  /**
   * @typedef {Object} TablePlayerModel player methods
   * @property {(playerId: string) => string} getNickname get player nickname
   * @property {(nickname, playerId: string) => void} setNickname set player nick name
   * @property {(playerId: string) => number} getScore get player score
   * @property {(score: number, playerId: string) => void} setScore set player score
   * @property {(playerId: string) => number} getActionPoint get player action point
   * @property {(actionPoint: number, playerId: string) => void} setActionPoint set player action point
   * @property {(playerId: string) => number} getWorkerToken get player remaining worker token
   * @property {(workerToken: number, playerId: string) => void} setWorkerToken set player remaining worker token
   * @property {(playerId: string) => number} getClosedProject get closed project number of player
   * @property {(closedProject: number, playerId: string) => void} setClosedProject set closed project number of player
   * @property {(playerId: string) => number} getTurnCreateProjectCount
   * @property {(count: number, playerId: string) => void} setTurnCreateProjectCount
   * @property {(playerId: string) => number} getTurnPlayProjectCardCount
   * @property {(count: number, playerId: string) => void} setTurnPlayProjectCardCount
   * @property {(playerId: string) => number} getTurnRecruitCount
   * @property {(count: number, playerId: string) => void} setTurnRecruitCount
   * @property {(playerId: string) => number} getTurnPlayJobCardCount
   * @property {(count: number, playerId: string) => void} setTurnPlayJobCardCount
   * @property {(playerId: string) => number} getTurnPlayForceCardCount
   * @property {(count: number, playerId: string) => void} setTurnPlayForceCardCount
   * @property {(playerId: string) => number} getTurnContributeCount
   * @property {(count: number, playerId: string) => void} setTurnContributeCount
   * @property {(playerId: string) => void} resetCounter
   * @property {(playerId: string, defaultNickname: string) => void} reset reset all player properties except playerId
   */
  const playerProperty = SpreadsheetApp.getActive().getSheetByName('PlayerProperty');
  /** @type {TablePlayerModel} */
  const PlayerModel = {
    getNickname: (playerId) => {
      return playerProperty.getRange(`${playerId}1`).getDisplayValue();
    },
    setNickname: (nickname, playerId) => {
      playerProperty.getRange(`${playerId}1`).setValue(nickname);
    },
    getScore: (playerId) => {
      return playerProperty.getRange(`${playerId}2`).getValue();
    },
    setScore: (score, playerId) => {
      playerProperty.getRange(`${playerId}2`).setValue(score);
    },
    getActionPoint: (playerId) => {
      return playerProperty.getRange(`${playerId}3`).getValue();
    },
    setActionPoint: (actionPoint, playerId) => {
      playerProperty.getRange(`${playerId}3`).setValue(actionPoint);
    },
    getWorkerToken: (playerId) => {
      return playerProperty.getRange(`${playerId}4`).getValue();
    },
    setWorkerToken: (workerToken, playerId) => {
      playerProperty.getRange(`${playerId}4`).setValue(workerToken);
    },
    getClosedProject: (playerId) => {
      return playerProperty.getRange(`${playerId}5`).getValue();
    },
    setClosedProject: (closedProject, playerId) => {
      playerProperty.getRange(`${playerId}5`).setValue(closedProject);
    },
    getTurnCreateProjectCount: (playerId) => {
      return playerProperty.getRange(`${playerId}6`).getValue();
    },
    setTurnCreateProjectCount: (count, playerId) => {
      playerProperty.getRange(`${playerId}6`).setValue(count);
    },
    getTurnPlayProjectCardCount: (playerId) => {
      return playerProperty.getRange(`${playerId}7`).getValue();
    },
    setTurnPlayProjectCardCount: (count, playerId) => {
      playerProperty.getRange(`${playerId}7`).setValue(count);
    },
    getTurnRecruitCount: (playerId) => {
      return playerProperty.getRange(`${playerId}8`).getValue();
    },
    setTurnRecruitCount: (count, playerId) => {
      playerProperty.getRange(`${playerId}8`).setValue(count);
    },
    getTurnPlayJobCardCount: (playerId) => {
      return playerProperty.getRange(`${playerId}9`).getValue();
    },
    setTurnPlayJobCardCount: (count, playerId) => {
      playerProperty.getRange(`${playerId}9`).setValue(count);
    },
    getTurnPlayForceCardCount: (playerId) => {
      return playerProperty.getRange(`${playerId}10`).getValue();
    },
    setTurnPlayForceCardCount: (count, playerId) => {
      playerProperty.getRange(`${playerId}10`).setValue(count);
    },
    getTurnContributeCount: (playerId) => {
      return playerProperty.getRange(`${playerId}11`).getValue();
    },
    setTurnContributeCount: (count, playerId) => {
      playerProperty.getRange(`${playerId}11`).setValue(count);
    },
    resetCounter: (playerId) => {
      playerProperty.getRange(`${playerId}6:${playerId}11`).clearContent();
    },
    reset: (playerId, defaultNickname) => {
      playerProperty.getRange(`${playerId}1`).setValue(defaultNickname);
      playerProperty.getRange(`${playerId}2:${playerId}11`).clearContent();
    }
  };

  /**
   * @typedef {Object} TablePlayerView render player information on main board
   * @property {(nickname, playerId: string) => void} setNickname set player nick name
   * @property {(score: number, playerId: string) => void} setScore set player score
   * @property {(actionPoint: number, playerId: string) => void} setActionPoint set player action point
   * @property {(workerToken: number, playerId: string) => void} setWorkerToken set player remaining worker token
   * @property {(playerId: string, defaultNickname: string) => void} reset reset all player properties except playerId
   */

  const playerIdMapRow = {
    A: 3, B: 4, C: 5,
    D: 6, E: 7, F: 8,
  };
  /** @type {TablePlayerView} */
  const PlayerView = {
    setNickname: (nickname, playerId) => {
      const row = playerIdMapRow[playerId];
      const col = 2;
      mainBoard.getRange(row, col).setValue(nickname);
    },
    setScore: (score, playerId) => {
      const row = playerIdMapRow[playerId];
      const col = 3;
      mainBoard.getRange(row, col).setValue(score);
    },
    setActionPoint: (point, playerId) => {
      const row = playerIdMapRow[playerId];
      const col = 4;
      mainBoard.getRange(row, col).setValue(point);
    },
    setWorkerToken: (token, playerId) => {
      const row = playerIdMapRow[playerId];
      const col = 5;
      mainBoard.getRange(row, col).setValue(token);
    },
    reset: (playerId, defaultNickname) => {
      PlayerView.setNickname(defaultNickname, playerId);
      PlayerView.setScore(0, playerId);
      PlayerView.setActionPoint(0, playerId);
      PlayerView.setWorkerToken(0, playerId);
    },
  };

  /** @type {TablePlayerController} */
  const Player = {
    setNickname: (nickname, playerId) => {
      PlayerModel.setNickname(nickname, playerId);
      PlayerView.setNickname(nickname, playerId);
    },
    getNickname: (playerId) => {
      return PlayerModel.getNickname(playerId);
    },
    isActionable: (cost, playerId) => {
      return cost <= PlayerModel.getActionPoint(playerId);
    },
    reduceActionPoint: (cost, playerId) => {
      const remain = PlayerModel.getActionPoint(playerId) - cost;
      PlayerModel.setActionPoint(remain, playerId);
      PlayerView.setActionPoint(remain, playerId);
      return remain;
    },
    isRecruitable: (playerId) => {
      return PlayerModel.getWorkerToken(playerId) > 0;
    },
    reduceWorkerTokens: (cost, playerId) => {
      const remain = PlayerModel.getWorkerToken(playerId) - cost;
      PlayerModel.setWorkerToken(remain, playerId);
      PlayerView.setWorkerToken(remain, playerId);
      return remain;
    },
    increaseWorkerTokens: (tokens, playerId) => {
      const result = PlayerModel.getWorkerToken(playerId) + tokens;
      PlayerModel.setWorkerToken(result, playerId);
      PlayerView.setWorkerToken(result, playerId);
      return result;
    },
    setNextTurnActionPoints: (nextTurnPoints, playerId) => {
      PlayerModel.setActionPoint(nextTurnPoints, playerId);
      PlayerView.setActionPoint(nextTurnPoints, playerId);
    },
    setInitWorkerTokens: (initTokens, playerId) => {
      PlayerModel.setWorkerToken(initTokens, playerId);
      PlayerView.setWorkerToken(initTokens, playerId);
    },
    earnScore: (score, playerId) => {
      const result = PlayerModel.getScore(playerId) + score;
      PlayerModel.setScore(result, playerId);
      PlayerView.setScore(result, playerId);
      return result;
    },
    resetTurnCounters: (playerId) => {
      PlayerModel.resetCounter(playerId);
    },
    reset: (playerId, defaultNickname) => {
      PlayerModel.reset(playerId, defaultNickname);
      PlayerView.reset(playerId, defaultNickname);
    },
  };

  return {
    ProjectCard,
    Player,
  };
})();
