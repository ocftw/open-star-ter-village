import { useCallback, useState } from 'react';
import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';

const CurrentPlayer: React.FC<BoardProps<Type.State.Root>> = (props) => {
  const { G, playerID, moves: nonTypeMoves, events, ctx } = props;
  const moves = nonTypeMoves as unknown as Type.Move.Moves;

  // TODO: replace indices with selected states
  const [projectCardIndex, setProjectCardIndex] = useState(-1);
  const onProjectCardIndexChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setProjectCardIndex(parseInt(event.target.value, 10));
  const [resourceCardIndex, setResourceCardIndex] = useState(-1);
  const onResourceCardIndexChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setResourceCardIndex(parseInt(event.target.value, 10));
  const [activeProjectIndex, setActiveProjectIndex] = useState(-1);
  const onActiveProjectIndexChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setActiveProjectIndex(parseInt(event.target.value, 10));
  const [slotIndex, setSlotIndex] = useState(-1);
  const onSlotIndexChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setSlotIndex(parseInt(event.target.value, 10));
  const [value, setValue] = useState(-1);
  const onValueChange: React.ChangeEventHandler<HTMLInputElement> = (event) =>
    setValue(parseInt(event.target.value, 10));
  const [contributions, setContributions] = useState<{ activeProjectIndex: number; slotIndex: number; value: number }[]>([]);
  const onAddContribution = useCallback(() => {
    if (activeProjectIndex >= 0 && slotIndex >= 0 && value > 0) {
      setContributions(cons => {
        return [...cons, { activeProjectIndex, slotIndex, value }];
      });
    }
  }, [activeProjectIndex, slotIndex, value]);

  if (playerID === null) {
    return null;
  }

  const onCreateProject = () => moves.createProject(projectCardIndex, resourceCardIndex);
  const onRecruit = () => moves.recruit(resourceCardIndex, activeProjectIndex);
  const onContribute = () => {
    moves.contribute(contributions);
    setContributions([]);
  };
  const onEndAction = () => events.endStage!();
  const onSettle = () => moves.settle();
  const onEndSettle = () => events.endStage!();
  const onRefillAndEnd = () => moves.refillAndEnd();
  const myCurrentStage = ctx.activePlayers ? ctx.activePlayers[playerID] : ''
  return (
    <div>
      <div>I am Player {playerID}</div>
      {myCurrentStage ? <div>my current stage: {myCurrentStage}</div> : null}
      <div>
        <div>
          <label>project card index:</label>
          <input
            type="number"
            min={-1}
            max={G.players[playerID].hand.projects.length - 1}
            value={projectCardIndex}
            onChange={onProjectCardIndexChange}
          />
        </div>
        <div>
          <label>resource card index:</label>
          <input
            type="number"
            min={-1}
            max={G.players[playerID].hand.resources.length - 1}
            value={resourceCardIndex}
            onChange={onResourceCardIndexChange}
          />
        </div>
        <div>
          <label>active project index:</label>
          <input
            type="number"
            min={-1}
            max={G.table.activeProjects.length - 1}
            value={activeProjectIndex}
            onChange={onActiveProjectIndexChange}
          />
        </div>
        <div>
          <label>slot index:</label>
          <input
            type="number"
            min={-1}
            max={5}
            value={slotIndex}
            onChange={onSlotIndexChange}
          />
        </div>
        <div>
          <label>value:</label>
          <input
            type="number"
            min={-1}
            max={3}
            value={value}
            onChange={onValueChange}
          />
        </div>
        <button onClick={onCreateProject}>Create Project</button>
        <button onClick={onRecruit}>Recruit</button>
        <button onClick={onAddContribution}>add contribution entity</button>
        <div>current contribution entities: {JSON.stringify(contributions)}</div>
        <button onClick={onContribute}>Contribute</button>
        <button onClick={onEndAction}>End Action</button>
        <button onClick={onSettle}>Settle</button>
        <button onClick={onEndSettle}>End Settle</button>
        <button onClick={onRefillAndEnd}>Refill and End</button>
      </div>
      <div>
        Project Cards:
        <ul>
          {
            G.players[playerID].hand.projects.map(p => (
              <li>
                <span>title: {p.name}</span>
                <span>jobs: {JSON.stringify(p.jobs)}</span>
              </li>))
          }
        </ul>
      </div>
      <div>
        Resource Cards:
        <ul>
          {
            G.players[playerID].hand.resources.map(r => (
              <li>
                <span>{r.name}</span>
              </li>))
          }
        </ul>
      </div>
    </div>
  );
}

export default CurrentPlayer;
