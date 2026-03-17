import { RuleMutator, RuleSelector } from "@/game/store/slice/rule";
import { GameHookHandler } from "../type"
import { ScoreBoardSelector } from "@/game/store/slice/scoreBoard";
import { JobSlotsMutator } from "@/game/store/slice/jobSlots";
import { DeckMutator, DeckSelector } from "@/game/store/slice/deck";
import { PlayersMutator } from "@/game/store/slice/players";
import { scoreUnfinishedProjects } from "./scoreUnfinishedProjects";

type EventCardHandler = {
  start: GameHookHandler;
  end?: GameHookHandler;
}

const endGameAfterThisRound: EventCardHandler = {
  start: ({ G }) => {
    // Leftover action tokens are converted to 1 victory points
    RuleMutator.setSettlementLeftoverActionTokensVictoryPoints(G.rules, 1);
  },
  end: (context) => {
    const { G, events } = context;
    RuleMutator.setSettlementLeftoverActionTokensVictoryPoints(G.rules, 0);
    scoreUnfinishedProjects(context);
    events.endGame({ winner: ScoreBoardSelector.getWinner(G.table.scoreBoard) });
  },
}

// 人力釋出: Discard all job cards from the table and refill to maxJobSlots
const discardAndRefillAllWorkerSlots: EventCardHandler = {
  start: ({ G }) => {
    const allJobCards = [...G.table.jobSlots];
    JobSlotsMutator.removeJobCards(G.table.jobSlots, allJobCards);
    DeckMutator.discard(G.decks.jobs, allJobCards);

    const maxJobSlots = RuleSelector.getTableMaxJobSlots(G.rules);
    const jobCards = DeckSelector.peek(G.decks.jobs, maxJobSlots);
    DeckMutator.draw(G.decks.jobs, maxJobSlots);
    JobSlotsMutator.addJobCards(G.table.jobSlots, jobCards);
  },
};

// 番茄醬工作法: This round, contributeOwnedProjects max contribution value is +1
const increaseOneOwnedProjectContributionValue: EventCardHandler = {
  start: ({ G }) => {
    RuleMutator.incrementContributeOwnedProjectsMaxContributionValue(G.rules);
  },
  end: ({ G }) => {
    RuleMutator.decrementContributeOwnedProjectsMaxContributionValue(G.rules);
  },
};

// 會計年度結算: Projects settled this round give project owner +2 bonus VP
const projectOwnerGetsTwoPoints: EventCardHandler = {
  start: ({ G }) => {
    RuleMutator.setEventExtraOwnerVictoryPoints(G.rules, 2);
  },
  end: ({ G }) => {
    RuleMutator.setEventExtraOwnerVictoryPoints(G.rules, 0);
  },
};

// 青年補助: If exactly one player has the lowest score, give them +1 action token
const theOnlyPlayerWithTheLowestVictoryPointsGetsOneExtraActionToken: EventCardHandler = {
  start: ({ G }) => {
    const allPoints = ScoreBoardSelector.getAllPlayerPoints(G.table.scoreBoard);
    const scores = Object.entries(allPoints);
    if (scores.length === 0) return;

    const minScore = Math.min(...scores.map(([, points]) => points));
    const playersWithMin = scores.filter(([, points]) => points === minScore);

    if (playersWithMin.length === 1) {
      const [playerId] = playersWithMin[0];
      PlayersMutator.addActionTokens(G.players, playerId, 1);
    }
  },
};

// 四大自由: Immediately add 2 more job cards; at end of round, remove 2 (auto-discard last 2 for MVP)
const addTwoWorkerSlots: EventCardHandler = {
  start: ({ G }) => {
    const extendedMax = RuleSelector.getTableMaxJobSlots(G.rules) + 2;
    RuleMutator.setTableMaxJobSlots(G.rules, extendedMax);
    const newCards = DeckSelector.peek(G.decks.jobs, 2);
    DeckMutator.draw(G.decks.jobs, 2);
    JobSlotsMutator.addJobCards(G.table.jobSlots, newCards);
  },
  end: ({ G }) => {
    const normalMax = RuleSelector.getTableMaxJobSlots(G.rules) - 2;
    RuleMutator.setTableMaxJobSlots(G.rules, normalMax);
    // Auto-discard the last 2 job cards (simplification; rulebook says last player chooses)
    const excess = G.table.jobSlots.slice(normalMax);
    if (excess.length > 0) {
      JobSlotsMutator.removeJobCards(G.table.jobSlots, excess);
      DeckMutator.discard(G.decks.jobs, excess);
    }
  },
};

// 斜槓青年: This round, the first job card used in createProject or recruit ignores job type matching
const ignoreFirstWorkerRequirement: EventCardHandler = {
  start: ({ G }) => {
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, true);
  },
  end: ({ G }) => {
    RuleMutator.setEventIgnoreFirstWorkerRequirement(G.rules, false);
  },
};

export const eventCardHandlers: Record<string, EventCardHandler> = {
  end_game_after_this_round: endGameAfterThisRound,
  discard_and_refill_all_worker_slots: discardAndRefillAllWorkerSlots,
  increase_one_owned_project_contribution_value: increaseOneOwnedProjectContributionValue,
  project_owner_gets_two_points: projectOwnerGetsTwoPoints,
  the_only_player_with_the_lowest_victory_points_gets_one_extra_action_token: theOnlyPlayerWithTheLowestVictoryPointsGetsOneExtraActionToken,
  ignore_first_worker_requirement: ignoreFirstWorkerRequirement,
  add_two_worker_slots: addTwoWorkerSlots,
};
