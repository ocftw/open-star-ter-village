import type { Ruleset } from '@/game/standard/config';
import { LobbyClientError } from 'boardgame.io/client';
import { GAME_NAME, GAME_SERVER_URL, lobbyClient } from '@/lib/lobbyClient';
import { isBotSeat } from '@/game/bots/seat';
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

/** A match is abandoned once no human is seated and connected; bot seats keep no room alive. */
export function isAbandonedMatch(players: LobbyMatch['players']): boolean {
  return players.length > 0 && players.every((player) => !player.name?.trim() || player.isConnected === false || isBotSeat(player));
}

export interface LobbyViewer {
  /**
   * The viewing browser still holds a seat credential for the room. That player
   * may only be disconnected (e.g. a solo human playing bots who opened the
   * lobby), so the nobody-connected rule must not hide the room from them.
   */
  holdsSeat?: boolean;
}

export function getLobbyStatus(match: LobbyMatch, { holdsSeat = false }: LobbyViewer = {}): LobbyStatus {
  const seatsFilled = getFilledSeatCount(match);
  const totalSeats = match.players.length;

  if (match.gameover !== undefined) {
    return 'Finished';
  }

  if (!holdsSeat && isAbandonedMatch(match.players)) {
    return 'Abandoned';
  }

  const started = hasHostStarted(match);

  // A started match with a vacated seat was terminated by a mid-game leave
  // (#420): hide it from the lobby instead of offering it as joinable.
  if (started && match.players.some((player) => !hasPlayerName(player))) {
    return 'Abandoned';
  }

  if (seatsFilled < totalSeats) {
    return 'Waiting';
  }

  if (!started) {
    return 'Full';
  }

  return 'In Progress';
}

export function toVisibleMatch(match: LobbyMatch, viewer: LobbyViewer = {}): VisibleMatch | null {
  const status = getLobbyStatus(match, viewer);
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

export async function listPublicMatches(holdsSeat: (matchID: string) => boolean = () => false): Promise<VisibleMatch[]> {
  const response = await lobbyClient.listMatches(GAME_NAME);

  return response.matches
    .map((match) => toVisibleMatch(match, { holdsSeat: holdsSeat(match.matchID) }))
    .filter((match): match is VisibleMatch => match !== null)
    .sort((left, right) => right.match.updatedAt - left.match.updatedAt);
}

export async function getMatch(matchID: string): Promise<LobbyMatch> {
  return lobbyClient.getMatch(GAME_NAME, matchID);
}

export async function createRoom(playerName: string, numPlayers: number, ruleset: Ruleset = 'simple'): Promise<MatchCredentials> {
  const { matchID } = await lobbyClient.createMatch(GAME_NAME, { numPlayers, ...(ruleset === 'simple' ? {} : { setupData: { ruleset } }) });
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
    data: { displayName: playerName },
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
      displayName: (await lobbyClient.getMatch(GAME_NAME, matchID)).players
        .find((player) => String(player.id) === playerID)?.data?.displayName,
    },
  });
}

async function postBotSeat(path: string, body: Record<string, unknown>): Promise<void> {
  const response = await fetch(`${GAME_SERVER_URL}/games/${GAME_NAME}/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error ?? `Request failed (${response.status})`);
  }
}

/** Host only, before the game starts: seat a server-run bot of `strategy` in an empty seat. */
export async function addBot(matchID: string, host: MatchCredentials, seat: number, strategy: string): Promise<void> {
  await postBotSeat(`${matchID}/bots`, { playerID: host.playerID, credentials: host.credential, seat, strategy });
}

/** Host only, before the game starts: free a bot seat. */
export async function removeBot(matchID: string, host: MatchCredentials, seat: number): Promise<void> {
  await postBotSeat(`${matchID}/bots/${seat}/remove`, { playerID: host.playerID, credentials: host.credential });
}

/** True when the server says the match does not exist (deleted, expired, or never created). */
export function isMatchNotFoundError(error: unknown): boolean {
  return error instanceof LobbyClientError && /\b404\b/.test(error.message);
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
