import { OpenStarTerVillage } from '@open-star-ter-village/webapp-game';
import { Client, BoardProps } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { OpenStarTerVillageType } from 'packages/game/src/types';

const Board: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = ({ G }) => {
  const Players = Object.keys(G.players).map(player => (
    <div className='player' key={player}>
      <div>Player {player}</div>
      <div>
        Hand: {JSON.stringify(G.players[player].hand)}
      </div>
      <div>
        WorkerTokens: {G.players[player].token.workers}
      </div>
      <div>
        CompletedProjects: {G.players[player].completed.projects}
      </div>
    </div>
  ))
  return (
    <div className='board'>
      {Players}
    </div>
  );
}

const Boardgame = Client({
  game: OpenStarTerVillage,
  board: Board,
  multiplayer: Local(),
});

export default Boardgame;
