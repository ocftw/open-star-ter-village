import { OpenStarTerVillage } from '@open-star-ter-village/webapp-game';
import { Client, BoardProps } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { OpenStarTerVillageType } from 'packages/game/src/types';

const Board: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = ({ G, playerID }) => {
  // show players summary
  const Players = Object.keys(G.players).map(player => (
    <div className='player' key={player}>
      <div>Player {player}</div>
      <ul>
        <li>
          WorkerTokens: {G.players[player].token.workers}
        </li>
        <li>
          CompletedProjects: {G.players[player].completed.projects}
        </li>
      </ul>
    </div>
  ));

  // show current player if not observer
  const CurrentPlayer = playerID !== null ? (
    <div>
      <div>I am Player {playerID}</div>
      Hand: {JSON.stringify(G.players[playerID].hand)}
    </div>
  ) : null;

  return (
    <div className='board'>
      {Players}
      {CurrentPlayer}
    </div>
  );
}

const Boardgame = Client({
  game: OpenStarTerVillage,
  board: Board,
  multiplayer: Local(),
});

export default Boardgame;
