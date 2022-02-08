import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType } from 'packages/game/src/types';

const CurrentPlayer: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  const { G, playerID } = props;
  if (playerID === null) {
    return null;
  }
  return (
    <div>
      <div>I am Player {playerID}</div>
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
