import React from 'react';
import { GameState } from "@/game";
import { BoardProps } from 'boardgame.io/react';

export type GameContext = BoardProps<GameState>;
export type GameContextComponentProps = { gameContext: GameContext; };
export type MapGameContextToProps<T> = (context: GameContext) => T;

export const connectGameContext = <GameContextProps extends {} = {}, OwnProps extends {} = {}>(mapGameContextToProps: MapGameContextToProps<GameContextProps>) => (Component: React.FC<GameContextProps>) => {
  const GameContextComponent: React.FC<GameContextComponentProps & OwnProps> = ({ gameContext, ...restProps }) => {
    const props = mapGameContextToProps(gameContext);
    return <Component {...props} {...restProps} />;
  };

  return GameContextComponent;
};
