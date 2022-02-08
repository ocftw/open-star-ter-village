import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType } from 'packages/game/src/types';

const CurrentPlayer: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  const { G, playerID, moves, events, ctx } = props;
  if (playerID === null) {
    return null;
  }
  // TODO: replace indices with selected states
  const projectCardIndex: number = 0;
  const resourceCardIndex: number = 0;
  const activeProjectIndex: number = 0;
  const onCreateProject = () => moves.createProject(projectCardIndex, resourceCardIndex);
  const onRecruit = () => moves.recruit(resourceCardIndex, activeProjectIndex);
  const onEndAction = () => events.endStage!();
  const onRefillAndEnd = () => moves.refillAndEnd();
  const myCurrentStage = ctx.activePlayers ? ctx.activePlayers[playerID] : ''
  return (
    <div>
      <div>I am Player {playerID}</div>
      {myCurrentStage ? <div>my current stage: {myCurrentStage}</div> : null}
      <div>
        <button onClick={onCreateProject}>Create Project</button>
        <button onClick={onRecruit}>Recruit</button>
        <button onClick={onEndAction}>End Action</button>
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
