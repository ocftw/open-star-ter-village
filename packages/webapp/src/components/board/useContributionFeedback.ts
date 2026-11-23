import { useEffect, useLayoutEffect, useState } from 'react';
import { GameContext } from '@/components/GameContextHelpers';
import { ContributionAction } from '@/game/core/ContributionAction';
import { ProjectSlotSelector } from '@/game/store/slice/projectSlot/projectSlot';
import { UserActionMoves } from '@/lib/reducers/actionStepSlice';

type ContributionMove = UserActionMoves.ContributeOwnedProjects | UserActionMoves.ContributeJoinedProjects;

export function isContributionAction(action: UserActionMoves | null): action is ContributionMove {
  return action === UserActionMoves.ContributeOwnedProjects || action === UserActionMoves.ContributeJoinedProjects;
}

type SubmittedRow = ContributionAction & { cardId: string; before: number };
type Submission = {
  stateId: number;
  move: ContributionMove;
  scope: string;
  rows: SubmittedRow[];
  status: 'awaiting' | 'accepted';
};

export type ContributionFeedback = Pick<Submission, 'stateId' | 'scope' | 'rows'>;

export function useContributionFeedback({ G, playerID, matchID, _stateID, log }: GameContext) {
  const board = G.table.projectBoard;
  const scope = JSON.stringify([matchID, playerID]);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const record = (move: ContributionMove, contributions: ContributionAction[]) => {
    if (playerID === null) return;
    const rows = contributions.flatMap((entry) => {
      const slot = board.find(({ id }) => id === entry.projectSlotId);
      return slot?.card ? [{
        ...entry,
        cardId: slot.card.id,
        before: ProjectSlotSelector.getWorkerContribution(slot, entry.jobName, playerID),
      }] : [];
    });
    if (rows.length === contributions.length) {
      setSubmission({ stateId: _stateID, move, scope, rows, status: 'awaiting' });
    }
  };

  useLayoutEffect(() => {
    if (!submission) return;
    if (scope !== submission.scope || playerID === null) {
      setSubmission(null);
      return;
    }
    if (submission.status === 'accepted' || _stateID <= submission.stateId) return;

    // These moves are client:false. Require the accepted move and its actual row deltas.
    const move = log?.find(({ _stateID: stateId, action }) =>
      stateId === submission.stateId && action.type === 'MAKE_MOVE' &&
      action.payload.type === submission.move && action.payload.playerID === playerID);
    const args: unknown = move?.action.payload.args?.[0];
    const accepted = Array.isArray(args) && args.length === submission.rows.length && submission.rows.every((row, index) => {
      const slot = board.find(({ id }) => id === row.projectSlotId);
      const sent = args[index] as ContributionAction | undefined;
      return sent?.projectSlotId === row.projectSlotId && sent.jobName === row.jobName && sent.value === row.value &&
        slot && slot.card?.id === row.cardId &&
        ProjectSlotSelector.getWorkerContribution(slot, row.jobName, playerID) === row.before + row.value;
    });
    setSubmission(accepted ? { ...submission, status: 'accepted' } : null);
  }, [submission, board, _stateID, log, scope, playerID]);

  useEffect(() => {
    if (!submission) return;
    const timer = window.setTimeout(() => setSubmission(null), submission.status === 'accepted' ? 700 : 2000);
    return () => window.clearTimeout(timer);
  }, [submission]);

  return {
    record,
    feedback: submission?.scope === scope && submission.status === 'accepted' ? submission : null,
  };
}
