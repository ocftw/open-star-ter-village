import { LobbyClientError } from 'boardgame.io/client';
import { GAME_NAME, lobbyClient } from '@/lib/lobbyClient';
import type { MatchCredentials } from '@/lib/matchCredentials';

export type LobbyMatch = Awaited<ReturnType<typeof lobbyClient.getMatch>>;
export type LobbyStatus = 'Waiting' | 'Full' | 'In Progress' | 'Finished' | 'Abandoned';

export interface VisibleMatch {
  match: LobbyMatch;
  openSeatID: string | null;
  seatsFilled: number;
  status: LobbyStatus;
  totalSeats: number;
}

export type LobbyErrorCode = 'MATCH_FULL';

export class LobbyError extends Error {
  code: LobbyErrorCode;

  constructor(code: LobbyErrorCode) {
    super(code);
    this.name = 'LobbyError';
    this.code = code;
  }
}

type LobbyPlayer = LobbyMatch['players'][number];

function compareSeatOrder(left: LobbyPlayer, right: LobbyPlayer): number {
  return left.id - right.id;
}

export function hasPlayerName(player: { name?: string }): boolean {
  return typeof player.name === 'string' && player.name.trim().length > 0;
}

export function getOpenSeatID(match: Pick<LobbyMatch, 'players'>): string | null {
  const openSeat = [...match.players]
    .sort(compareSeatOrder)
    .find((player) => !hasPlayerName(player));

  return openSeat ? String(openSeat.id) : null;
}

export function getFilledSeatCount(match: Pick<LobbyMatch, 'players'>): number {
  return match.players.filter(hasPlayerName).length;
}

export function hasHostStarted(match: Pick<LobbyMatch, 'players'>): boolean {
  const host = match.players.find((player) => player.id === 0);
  if (!host || typeof host.data !== 'object' || host.data === null) {
    return false;
  }

  return (
    typeof host.data === 'object' &&
    host.data !== null &&
    'started' in host.data &&
    (host.data as Record<string, unknown>)['started'] === true
  );
}

export function getLobbyStatus(match: LobbyMatch): LobbyStatus {
  const seatsFilled = getFilledSeatCount(match);
  const totalSeats = match.players.length;

  if (match.gameover !== undefined) {
    return 'Finished';
  }

  if (seatsFilled === 0) {
    return 'Abandoned';
  }

  if (seatsFilled < totalSeats) {
    return 'Waiting';
  }

  if (!hasHostStarted(match)) {
    return 'Full';
  }

  return 'In Progress';
}

export function toVisibleMatch(match: LobbyMatch): VisibleMatch | null {
  const status = getLobbyStatus(match);
  if (status === 'Finished' || status === 'Abandoned') {
    return null;
  }

  return {
    match,
    openSeatID: getOpenSeatID(match),
    seatsFilled: getFilledSeatCount(match),
    status,
    totalSeats: match.players.length,
  };
}

export async function listPublicMatches(): Promise<VisibleMatch[]> {
  const response = await lobbyClient.listMatches(GAME_NAME);

  return response.matches
    .map(toVisibleMatch)
    .filter((match): match is VisibleMatch => match !== null)
    .sort((left, right) => right.match.updatedAt - left.match.updatedAt);
}

export async function getMatch(matchID: string): Promise<LobbyMatch> {
  return lobbyClient.getMatch(GAME_NAME, matchID);
}

export async function createRoom(playerName: string, numPlayers: number): Promise<MatchCredentials> {
  const { matchID } = await lobbyClient.createMatch(GAME_NAME, { numPlayers });
  try {
    return await joinRoom(matchID, playerName, '0');
  } catch (error) {
    throw new Error(
      `Match created (${matchID}) but failed to join seat 0: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function joinRoom(
  matchID: string,
  playerName: string,
  preferredSeatID?: string,
): Promise<MatchCredentials> {
  const joinedMatch = await lobbyClient.joinMatch(GAME_NAME, matchID, {
    playerID: preferredSeatID,
    playerName,
  });

  return {
    matchID,
    playerID: joinedMatch.playerID,
    credential: joinedMatch.playerCredentials,
    playerName,
  };
}

export async function joinPublicMatch(
  matchID: string,
  playerName: string,
): Promise<{ playerID: string; credentials: string }> {
  const match = await getMatch(matchID);
  const openSeatID = getOpenSeatID(match);

  if (!openSeatID) {
    throw new LobbyError('MATCH_FULL');
  }

  const credentials = await joinRoom(matchID, playerName, openSeatID);

  return {
    playerID: credentials.playerID,
    credentials: credentials.credential,
  };
}

export async function leaveRoom(matchID: string, playerID: string, credential: string): Promise<void> {
  await lobbyClient.leaveMatch(GAME_NAME, matchID, {
    playerID,
    credentials: credential,
  });
}

export async function startRoom(matchID: string, playerID: string, credential: string): Promise<void> {
  await lobbyClient.updatePlayer(GAME_NAME, matchID, {
    playerID,
    credentials: credential,
    data: {
      started: true,
    },
  });
}

export function getLobbyErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof LobbyClientError) {
    if (error.message.includes('409')) {
      return 'That seat was taken just now. Refresh the lobby and try again.';
    }

    if (typeof error.details === 'string' && error.details.length > 0) {
      return error.details;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return defaultMessage;
}
