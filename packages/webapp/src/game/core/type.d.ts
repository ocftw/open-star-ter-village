import { FnContext, PlayerID, StageConfig } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { GameState } from '../store/store';

// Define the type of a move to support type checking
export type GameMove<Fn extends (...params: any[]) => void> = (context: FnContext<GameState> & { playerID: PlayerID }, ...args: Parameters<Fn>) => void | GameState | typeof INVALID_MOVE;

// Define the type of a hook to support type checking
export type GameHookHandler = (context: FnContext<GameState>) => void | GameState;

export type GameStageConfig = StageConfig<GameState>;
