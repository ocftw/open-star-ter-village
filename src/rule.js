// @ts-check

/**
 * @typedef {Object} Rule rule methods
 * @property {RulePlayProjectCard} playProjectCard includes action point costs, recruit restrictions
 * @property {RuleRecruit} recruit rule modification of recruit action
 * @property {RuleContribute} contribute rule modification of contribute action
 * @property {RulePlayForce} playForce rule modification of force card
 * @property {RuleSettlePhase} settlePhase rule modification of settle phase
 * @property {RulePeekNextEvent} peekNextEvent whether next event card can be peeked
 * @property {RuleMaxProjectSlots} maxProjectSlots maximum number of available project slots
 * @property {RulePlayerHand} playerHand the maximum cards player should have at the end of the turn
 * @property {() => void} reset reset the rules to default
 *
 * @typedef {Object} RulePlayProjectCard
 * @property {() => boolean} getIsAvailable get current availability of play project action
 * @property {(isAvailable: boolean) => void} setIsAvailable set availability of play project action
 * @property {() => number} getActionPoint get current action point cost of play project card
 * @property {(n: number) => void} setActionPoint set action point cost of play project card
 * @property {() => boolean} getJobRestricton get current recruit job restriction when playing project card
 * @property {(restriction: boolean) => void} setJobRestriction set recruit job restriction when playing project card
 * @property {(job: Card) => number} getInitContributionPoint get initial contribution point of specific job type
 * @property {(n: number, job: Card) => void} setInitContributionPoint set initail contribution point to job
 *
 * @typedef {Object} RuleRecruit
 * @property {() => boolean} getIsAvailable get current availability of recruit action
 * @property {(isAvailable: boolean) => void} setIsAvailable set availability of recruit action
 * @property {() => boolean} getJobRestriction get current job restriction of recruit action
 * @property {(restriction:boolean) => void} setJobRestriction set job restriction of recruit action
 *
 * @typedef {Object} RuleContribute
 * @property {() => boolean} getIsAvailable get current availability of contribute action
 * @property {(isAvailable: boolean) => void} setIsAvailable set availability of contribute action
 * @property {() => number} getContribution get spendable contribution points for each action
 * @property {(contribution:number) => void} setContribution set spendable contribution points for each action
 *
 * @typedef {Object} RulePlayForce
 * @property {() => boolean} getIsAvailable get current availability of play force action
 * @property {(isAvailable: boolean) => void} setIsAvailable set availability of play force action
 *
 * @typedef {Object} RuleSettlePhase
 * @property {() => number} getOwnerBonus get current owner bonus
 * @property {(bonus:number) => void} setOwnerBonus set current owner bonus
 * @property {(projectType: string) => number} getParticipantBonus get current participant bonus of specific project type
 * @property {(projectType: string, bonus: number) => void} setParticipantBonus set current participant bonus of specific project type
 *
 * @typedef {Object} RulePeekNextEvent
 * @property {() => boolean} getIsAvailable get availability of peek next event card
 * @property {(isAvailable) => void} setIsAvailable set availability of peek next event card
 *
 * @typedef {Object} RuleMaxProjectSlots
 * @property {() => number} getNum get max project slots
 * @property {(slot: number) => void} setNum set max project slots
 *
 * @typedef {Object} RulePlayerHand
 * @property {RuleCard} projectCard
 * @property {RuleCard} resourceCard
 *
 * @typedef {Object} RuleCard
 * @property {() => number} getMax get current max card numbers
 * @property {(max: number) => void} setMax set max card numbers
 */
/** @type {Rule} */
const Rule = (() => {
  const ruleSet = SpreadsheetApp.getActive().getSheetByName('RuleSet');

  /** @type {RulePlayProjectCard} */
  const playProjectCard = {
    getIsAvailable: () => {
      return ruleSet.getRange('D1').getValue();
    },
    setIsAvailable: (isAvailable) => {
      ruleSet.getRange('D1').setValue(isAvailable);
    },
    getActionPoint: () => {
      return ruleSet.getRange('D2').getValue();
    },
    setActionPoint: (n) => {
      ruleSet.getRange('D2').setValue(n);
    },
    getJobRestricton: () => {
      return ruleSet.getRange('D3').getValue();
    },
    setJobRestriction: (restriction) => {
      ruleSet.getRange('D3').setValue(restriction);
    },
    getInitContributionPoint: (job) => {
      const rows = ruleSet.getRange('C4:D10').getValues();
      const pair = rows.find(row => row[0] === job);
      if (!pair) {
        Logger.log(`Unknown job type ${job}`);
        throw new Error(`Unknown job type ${job}`);
      }
      return pair[1];
    },
    setInitContributionPoint: (n, job) => {
      const rows = ruleSet.getRange('C4').getValues();
      const index = rows.findIndex(row => row[0] === job);
      if (index === -1) {
        Logger.log(`Unknown job type ${job}`);
        throw new Error(`Unknown job type ${job}`);
      }
      ruleSet.getRange('D4').offset(index, 0).setValue(n);
    }
  };

  /** @type {RuleRecruit} */
  const recruit = {
    getIsAvailable: () => {
      return ruleSet.getRange('D11').getValue();
    },
    setIsAvailable: (isAvailable) => {
      ruleSet.getRange('D11').setValue(isAvailable);
    },
    getJobRestriction: () => {
      return ruleSet.getRange('D12').getValue();
    },
    setJobRestriction: (restriction) => {
      ruleSet.getRange('D12').setValue(restriction);
    }
  }

  /** @type {RuleContribute} */
  const contribute = {
    getIsAvailable: () => {
      return ruleSet.getRange('D13').getValue();
    },
    setIsAvailable: (isAvailable) => {
      ruleSet.getRange('D13').setValue(isAvailable);
    },
    getContribution: () => {
      return ruleSet.getRange('D14').getValue();
    },
    setContribution: (contribution) => {
      ruleSet.getRange('D14').setValue(contribution);
    }
  }

  /** @type {RulePlayForce} */
  const playForce = {
    getIsAvailable: () => {
      return ruleSet.getRange('D15').getValue();
    },
    setIsAvailable: (isAvailable) => {
      ruleSet.getRange('D15').setValue(isAvailable);
    }
  }

  /** @type {RuleSettlePhase} */
  const settlePhase = {
    getOwnerBonus: () => {
      return ruleSet.getRange('D16').getValue();      
    },
    setOwnerBonus: (bonus) => {
      ruleSet.getRange('D16').setValue(bonus);
    },
    getParticipantBonus: (projectType) => {
      const rows = ruleSet.getRange('C17:D19').getValues();
      const pair = rows.find(row => row[0] === projectType);
      if (!pair) {
        Logger.log(`Unknown project type ${projectType}`);
        throw new Error(`Unknown project type ${projectType}`);
      }
      return pair[1];
    },
    setParticipantBonus: (projectType, bonus) => {
      const rows = ruleSet.getRange('C17:C19').getValues();
      const index = rows.findIndex(row => row[0] === projectType);
      if (index === -1) {
        Logger.log(`Unknown job type ${projectType}`);
        throw new Error(`Unknown job type ${projectType}`);
      }
      ruleSet.getRange('D17').offset(index, 0).setValue(bonus);
    }
  }

  /** @type {RulePeekNextEvent} */
  const peekNextEvent = {
    getIsAvailable: () => {
      return ruleSet.getRange('D20').getValue();
    },
    setIsAvailable: (isAvailable) => {
      ruleSet.getRange('D20').setValue(isAvailable);
    }
  }

  /** @type {RuleMaxProjectSlots} */
  const maxProjectSlots = {
    getNum: () => {
      return ruleSet.getRange('D21').getValue();
    },
    setNum: (slot) => {
      ruleSet.getRange('D21').setValue(slot);
    }
  }

  /** @type {RulePlayerHand} */
  const playerHand = {
    projectCard: {
      getMax: () => {
        return ruleSet.getRange('D22').getValue();
      },
      setMax: (max) => {
        ruleSet.getRange('D22').setValue(max);
      }
    },
    resourceCard: {
      getMax: () => {
        return ruleSet.getRange('D23').getValue();
      },
      setMax: (max) => {
        ruleSet.getRange('D23').setValue(max);
      }
    },
  };

  const reset = () => {
    ruleSet.getRange('E1:F23').copyTo(ruleSet.getRange('C1:D23'));
  };

  return {
    playProjectCard,
    recruit,
    contribute,
    playForce,
    settlePhase,
    peekNextEvent,
    maxProjectSlots,
    playerHand,
    reset,
  };
})();
