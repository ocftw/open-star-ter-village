import { BoardProps } from 'boardgame.io/react';
import { OpenStarTerVillageType as Type } from 'packages/game/src/types';

type Props = BoardProps<Type.State.Root>;

const Table: React.FC<Props> = (props) => {
  const { G } = props;

  return (
    <div>
      <h2>Table</h2>
      {JSON.stringify(G.table)}
    </div>
  )
}

export default Table;
