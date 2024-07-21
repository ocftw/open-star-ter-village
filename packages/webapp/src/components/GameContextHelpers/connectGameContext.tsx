import React from 'react';
import { GameState } from "@/game";
import { BoardProps } from 'boardgame.io/react';

export type GameContext = BoardProps<GameState>;
export type GameContextComponentProps = { gameContext: GameContext; };
export type MapGameContextToProps<TProps, TOwnProps> = (context: GameContext, ownProps: TOwnProps) => TProps;

export const connectGameContext = <GameContextProps extends {} = {}, TOwnProps extends {} = {}>(mapGameContextToProps: MapGameContextToProps<GameContextProps, TOwnProps>) => (Component: React.FC<GameContextProps>) => {
  const GameContextComponent: React.FC<GameContextComponentProps & TOwnProps> = ({ gameContext, ...restProps }) => {
    const ownProps = restProps as unknown as TOwnProps;
    const props = mapGameContextToProps(gameContext, ownProps);
    return <Component {...props} {...restProps} />;
  };

  return GameContextComponent;
};
