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
      Hand: {JSON.stringify(G.players[playerID].hand)}
    </div>
  );
}

export default CurrentPlayer;
