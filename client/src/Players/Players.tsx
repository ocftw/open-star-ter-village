import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType } from 'packages/game/src/types';

const Players: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  const { G } = props;
  const players = Object.keys(G.players).map(player => (
    <div className='Player' key={player}>
      <div>Player {player}</div>
      <ul>
        <li>
          WorkerTokens: {G.players[player].token.workers}
        </li>
        <li>
          ActionTokens: {G.players[player].token.actions}
        </li>
        <li>
          CompletedProjects: {JSON.stringify(G.players[player].completed.projects)}
        </li>
      </ul>
    </div>
  ));
  return (
    <>
      <h2>Players</h2>
      <div className='Players'>{players}</div>
    </>
  );
}

export default Players;
