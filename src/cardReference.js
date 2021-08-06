/**
 * @typedef {Object} ProjectCardSpecObject
 * @property {string} name
 * @property {string} type
 * @property {string} ownerScore
 * @property {string} contributorScore
 * @property {{ title: string, slots: number, goalContributionPoints: number }[]} groups
 */
/**
 * @typedef {Object} ProjectCardReference
 * @property {(card: Card) => ProjectCardSpecObject} getSpecByCard
 * @property {(resourceCard: Card, projectCard: Card) => number} findEligibleSlotId
 *  check the slot is eligible for the resource card
 */
/**
 * @typedef {Object} ResourceCardReference
 * @property {(card: Card) => boolean} isForceCard check whether the resource card is force card
 */
/** @type {ProjectCardReference} */
const ProjectCardRef = (() => {
  // project spec helper
  const ProjectCardSpecs = SpreadsheetApp.getActive().getSheetByName('ProjectCardSpecs');

  const getSpecByCard = (card) => {
    const [headers, ...data] = ProjectCardSpecs.getDataRange().getValues();
    const name = headers.findIndex(header => header === 'name');
    const result = data.find(row => row[name] === card);

    const type = headers.findIndex(header => header === 'type');
    const ownerScore = headers.findIndex(header => header === 'ownerScore');
    const contributorScore = headers.findIndex(header => header === 'contributorScore');
    const groups = [0, 1, 2, 3, 4, 5].reduce((arr, i) => {
      const titleIdx = headers.findIndex(header => header === `resource[${i}].title`);
      const slotsIdx = headers.findIndex(header => header === `resource[${i}].slots`);
      const goalContributionPointsIdx = headers.findIndex(header => header === `resource[${i}].goalContributionPoints`);
      const title = result[titleIdx];
      const slots = result[slotsIdx];
      const goalContributionPoints = result[goalContributionPointsIdx];
      if (title && slots && goalContributionPoints) {
        return [...arr, { title, slots, goalContributionPoints }];
      }
      return arr;
    }, []);

    Logger.log(`get project card ${card} spec ${JSON.stringify(result)}`);

    return {
      name: result[name],
      type: result[type],
      ownerScore: result[ownerScore],
      contributorScore: result[contributorScore],
      groups,
    };
  };
  const findEligibleSlotId = (resource, project) => {
    let slotId = 0;
    const spec = ProjectCardRef.getSpecByCard(project);
    const result = spec.groups.find(group => {
      if (group.title === resource) {
        return true;
      }
      slotId += group.slots;
      return false;
    });
    Logger.log(`find eligible slot of resource ${resource} on project ${project}`);
    // found eligible slot return slot id o.w. return -1
    return !!result ? slotId : -1;
  };

  return {
    getSpecByCard: withCache(getSpecByCard),
    findEligibleSlotId,
  };
})();

/** @type {ResourceCardReference} */
const resourceCardRef = (() => {
  const forceCardList = SpreadsheetApp.getActive().getSheetByName('源力卡介紹').getDataRange().getValues();
  const isForceCard = (card) => {
    const index = forceCardList.findIndex(row => row[0] === card);
    return index >= 0;
  }
  return {
    isForceCard
  };
})();
