import { OpenStarTerVillage } from '@open-star-ter-village/webapp-game';
import { Client, BoardProps } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { OpenStarTerVillageType } from 'packages/game/src/types';
import Players from './Players/Players';

const Board: React.FC<BoardProps<OpenStarTerVillageType.State.Root>> = (props) => {
  const { G, playerID } = props;
  // show current player if not observer
  const CurrentPlayer = playerID !== null ? (
    <div>
      <div>I am Player {playerID}</div>
      Hand: {JSON.stringify(G.players[playerID].hand)}
    </div>
  ) : null;

  // show game table
  const Table = (
    <div>
      <div>Table</div>
      {JSON.stringify(G.table)}
    </div>
  );

  return (
    <div className='board'>
      <Players {...props} />
      {CurrentPlayer}
      {Table}
    </div>
  );
}

const Boardgame = Client({
  game: OpenStarTerVillage,
  board: Board,
  multiplayer: Local(),
});

export default Boardgame;
