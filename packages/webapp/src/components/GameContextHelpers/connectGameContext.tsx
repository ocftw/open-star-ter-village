import React from 'react';
import { GameState } from "@/game";
import { BoardProps } from 'boardgame.io/react';

export type GameContext = BoardProps<GameState>;
export type GameContextComponentProps = { gameContext: GameContext; };
export type MapGameContextToProps<TProps, TOwnProps> = (context: GameContext, ownProps: TOwnProps) => TProps;

export const connectGameContext = <
  GameContextProps extends {},
  TOwnProps extends {} = {},
>(
  mapGameContextToProps: MapGameContextToProps<GameContextProps, TOwnProps>
) => (
  Component: React.FC<GameContextProps & Omit<TOwnProps, keyof GameContextProps>>
) => {
  type RestProps = Omit<GameContextComponentProps & TOwnProps, keyof GameContextComponentProps>;
  const GameContextComponent: React.FC<GameContextComponentProps & TOwnProps> = ({
    gameContext,
    ...restProps
  }) => {
    const ownProps: TOwnProps = restProps as RestProps & TOwnProps;
    const mappedProps = mapGameContextToProps(gameContext, ownProps);
    return <Component {...ownProps} {...mappedProps} />;
  };

  return GameContextComponent;
};
