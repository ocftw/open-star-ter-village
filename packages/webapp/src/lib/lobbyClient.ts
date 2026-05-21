import { LobbyClient } from 'boardgame.io/client';

export const GAME_SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001';
export const GAME_NAME = 'OpenStarTerVillage';

export const lobbyClient = new LobbyClient({ server: GAME_SERVER_URL });
