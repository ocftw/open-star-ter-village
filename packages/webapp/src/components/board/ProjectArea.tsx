import React from 'react';
import { GameContext } from '@/components/GameContextHelpers';
import { RuleSelector } from '@/game/store/slice/rule';
import { ProjectSlotState } from '@/game';
import BoardProjectSlot from './BoardProjectSlot';
import { ProfessionPicker } from './professionPicker';
import { capacityHint, splitProjectSlots } from './projectArea';

const YOURS_EMPTY = '還沒有發起專案。按右側「發起專案」開始。';
const OTHERS_EMPTY = '其他玩家還沒有發起專案。';

export default function ProjectArea({ gameContext, projectsRef, professionPickerFor, veiled = false }: {
  gameContext: GameContext;
  projectsRef: React.RefObject<HTMLDivElement>;
  veiled?: boolean;
  professionPickerFor: (slot: ProjectSlotState) => ProfessionPicker | undefined;
}) {
  const { G, ctx, playerID, matchData } = gameContext;
  const { yours, others } = splitProjectSlots(G.table.projectBoard, playerID);
  const maxSlots = RuleSelector.getTableMaxProjectSlots(G.rules);
  const available = G.table.projectBoard.length - (yours.length + others.length);
  const full = available === 0;
  const observer = playerID === null;

  const board = G.table.projectBoard;
  const previousBoard = React.useRef(board);
  const previousPlaced = React.useRef<string[]>([]);
  const newPlacements = board === previousBoard.current ? [] : board
    .filter((slot) => slot.card && slot.owner === ctx?.currentPlayer &&
      !previousBoard.current.some((old) => old.id === slot.id && old.card?.id === slot.card?.id))
    .map((slot) => slot.id);
  const placed = newPlacements.length ? newPlacements : previousPlaced.current;
  React.useLayoutEffect(() => {
    previousBoard.current = board;
    previousPlaced.current = placed;
  }, [board, placed]);
  React.useLayoutEffect(() => {
    projectsRef.current?.toggleAttribute('inert', veiled);
  }, [projectsRef, veiled]);

  const hint = (
    <span
      className={`project-area-hint${full ? ' project-area-hint-full' : ''}`}
      data-testid="project-capacity"
      data-available={available}
      data-capacity={maxSlots}
    >
      ⓘ {capacityHint(maxSlots)}{full ? ' · 已滿' : ''}
    </span>
  );

  const cards = (slots: ProjectSlotState[], empty: string) =>
    slots.length > 0 ? (
      <div className="project-area-grid">
        {slots.map((slot) => (
          <BoardProjectSlot
            key={slot.id}
            slot={slot}
            playerID={playerID}
            matchData={matchData}
            idle={false}
            professionPicker={professionPickerFor(slot)}
            placed={placed.includes(slot.id)}
          />
        ))}
      </div>
    ) : (
      <p className="project-area-empty">{empty}</p>
    );

  return (
    <div
      ref={projectsRef}
      data-testid="projects-section"
      className="project-area"
      aria-hidden={veiled || undefined}
      data-start-veiled={veiled || undefined}
    >
      {!observer && (
        <section aria-label="你的專案" data-testid="projects-yours">
          <div className="project-area-head">
            <h3>你的專案</h3>
            {hint}
          </div>
          {cards(yours, YOURS_EMPTY)}
        </section>
      )}
      <section aria-label="他人的專案" data-testid="projects-others">
        <div className="project-area-head">
          <h3>他人的專案</h3>
          {observer && hint}
        </div>
        {cards(others, OTHERS_EMPTY)}
      </section>
    </div>
  );
}
