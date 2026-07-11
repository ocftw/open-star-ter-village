'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Snackbar } from '@mui/material';
import { PaperCard, StickerButton } from '@/components/design';
import Field from '@/components/lobby/Field';
import LobbyNav from '@/components/lobby/LobbyNav';
import Note from '@/components/lobby/Note';
import Segmented from '@/components/lobby/Segmented';
import { loadCredentials, saveCredentials, type MatchCredentials } from '@/lib/matchCredentials';
import { usePolling } from '@/lib/usePolling';
import { useSnackbar } from '@/lib/useSnackbar';
import {
  createRoom,
  getLobbyErrorMessage,
  joinPublicMatch,
  LobbyError,
  listPublicMatches,
  type VisibleMatch,
} from './actions';

const PLAYER_NAME_STORAGE_KEY = 'open-star-ter-village.player-name';
const PLAYER_COUNT_OPTIONS = [3, 4, 5, 6] as const;

function isValidPlayerName(value: string): boolean {
  const trimmedValue = value.trim();
  return trimmedValue.length >= 1 && trimmedValue.length <= 20;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

function CardHeading({
  icon,
  iconBackground,
  zh,
  en,
}: {
  icon: string;
  iconBackground: string;
  zh: string;
  en: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: iconBackground,
          color: 'white',
          display: 'grid',
          placeItems: 'center',
          border: '2px solid var(--ink)',
          boxShadow: '0 2px 0 var(--ink)',
          fontSize: 20,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <h2 style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 16, fontWeight: 800 }}>
        {zh} <span className="en-cap">{en}</span>
      </h2>
    </div>
  );
}

function MatchRow({
  match,
  seatsFilled,
  totalSeats,
  status,
  joining,
  disabled,
  onJoin,
}: {
  match: VisibleMatch['match'];
  seatsFilled: number;
  totalSeats: number;
  status: string;
  joining: boolean;
  disabled: boolean;
  onJoin: () => void;
}) {
  return (
    <div
      data-testid={`match-row-${match.matchID}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'white',
        border: '1.5px solid var(--ink)',
        borderRadius: 12,
        boxShadow: '0 2px 0 var(--ink)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {match.matchID}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
          {formatDate(match.createdAt)} · {status}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {Array.from({ length: totalSeats }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: i < seatsFilled ? 'var(--orange)' : 'white',
              border: '1.5px solid var(--ink)',
            }}
          />
        ))}
        <span
          style={{
            marginLeft: 4,
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-en)',
          }}
        >
          {seatsFilled}/{totalSeats}
        </span>
      </div>
      <StickerButton variant="teal" size="sm" onClick={onJoin} disabled={disabled}>
        {joining ? '加入中… · Joining' : '加入 · Join'}
      </StickerButton>
    </div>
  );
}

export default function LobbyPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = React.useState('');
  const [numPlayers, setNumPlayers] = React.useState<number>(3);
  const [matches, setMatches] = React.useState<VisibleMatch[]>([]);
  const [loadError, setLoadError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [joiningMatchID, setJoiningMatchID] = React.useState<string | null>(null);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const trimmedPlayerName = playerName.trim();
  const playerNameIsValid = isValidPlayerName(playerName);

  const fetchMatches = React.useCallback(async (silent = false) => {
    try {
      const nextMatches = await listPublicMatches();
      setMatches(nextMatches);
      setLoadError(false);
    } catch (error) {
      if (!silent) {
        setLoadError(true);
      }
      showSnackbar(getLobbyErrorMessage(error, 'Unable to load matches.'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showSnackbar]);

  React.useEffect(() => {
    const storedPlayerName = localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
    if (storedPlayerName) {
      setPlayerName(storedPlayerName);
    }
  }, []);

  React.useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  usePolling(React.useCallback(() => fetchMatches(true), [fetchMatches]), 10_000);

  const handlePlayerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setPlayerName(nextValue);
    localStorage.setItem(PLAYER_NAME_STORAGE_KEY, nextValue);
  };

  const handleRefreshMatches = async () => {
    setIsRefreshing(true);

    try {
      await fetchMatches();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!playerNameIsValid) {
      showSnackbar('Enter a player name between 1 and 20 characters.', 'error');
      return;
    }

    setIsCreating(true);

    try {
      const credentials = await createRoom(trimmedPlayerName, numPlayers);
      saveCredentials(credentials);
      router.push(`/game/${credentials.matchID}`);
    } catch (error) {
      showSnackbar(getLobbyErrorMessage(error, 'Unable to create the match.'), 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMatch = async (matchID: string) => {
    if (!playerNameIsValid) {
      showSnackbar('Enter a player name between 1 and 20 characters before joining.', 'error');
      return;
    }

    const existing = loadCredentials(matchID);
    if (existing) {
      router.push(`/game/${matchID}`);
      return;
    }

    setJoiningMatchID(matchID);

    try {
      const joinedMatch = await joinPublicMatch(matchID, trimmedPlayerName);
      const credentials: MatchCredentials = {
        matchID,
        playerID: joinedMatch.playerID,
        credential: joinedMatch.credentials,
        playerName: trimmedPlayerName,
      };
      saveCredentials(credentials);
      router.push(`/game/${matchID}`);
    } catch (error) {
      if (error instanceof LobbyError && error.code === 'MATCH_FULL') {
        showSnackbar('This match is already full.', 'info');
        await fetchMatches();
        return;
      }

      showSnackbar(getLobbyErrorMessage(error, 'Unable to join that match.'), 'error');
      await fetchMatches();
    } finally {
      setJoiningMatchID(null);
    }
  };

  return (
    <main style={{ minHeight: '100vh' }}>
      <LobbyNav />
      <div className="page-pad">
        <h1 style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 22, fontWeight: 800, marginBottom: 28 }}>
          開始一場遊戲 <span className="en-cap">Start a session</span>
        </h1>

        <div className="grid-2col">
          {/* Create room */}
          <PaperCard padding={28} data-testid="create-room-card">
            <CardHeading icon="＋" iconBackground="var(--orange)" zh="開新房間" en="Create room" />
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 10 }}>
              當村長，邀請朋友加入，人到齊後開始遊戲。
              <br />
              <span className="en-cap">Host a match — invite up to 6 players.</span>
            </p>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field
                label="玩家名稱 · Player name"
                placeholder="你的暱稱"
                value={playerName}
                onChange={handlePlayerNameChange}
                error={playerName.length > 0 && !playerNameIsValid}
                helper="1 到 20 個字 · Use 1 to 20 visible characters."
              />
              <Segmented
                label="玩家人數 · Players"
                options={PLAYER_COUNT_OPTIONS}
                value={numPlayers as (typeof PLAYER_COUNT_OPTIONS)[number]}
                onChange={(count) => setNumPlayers(count)}
                disabled={isCreating}
              />
            </div>
            <StickerButton
              onClick={() => void handleCreateMatch()}
              disabled={isCreating}
              style={{ marginTop: 22, width: '100%' }}
            >
              {isCreating ? '建立中… · Creating' : '建立房間 · Create'}
            </StickerButton>
          </PaperCard>

          {/* Open lobbies */}
          <PaperCard padding={28} data-testid="open-lobbies-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <CardHeading icon="→" iconBackground="var(--teal)" zh="加入房間" en="Open lobbies" />
              <StickerButton
                variant="ghost"
                size="sm"
                onClick={() => void handleRefreshMatches()}
                disabled={isRefreshing || isCreating}
              >
                {isRefreshing ? '更新中…' : '重新整理 · Refresh'}
              </StickerButton>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 10 }}>
              從清單裡選一個公開房間加入。
              <br />
              <span className="en-cap">Pick a public room from the list.</span>
            </p>

            <div className="dotted" style={{ margin: '18px 0' }} />

            {isLoading ? (
              <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>載入中… Loading matches…</div>
            ) : loadError ? (
              <Note tone="error">Unable to load matches. Check your connection and try refreshing.</Note>
            ) : matches.length === 0 ? (
              <Note tone="info">
                目前沒有等待中的公開房間，開一間吧！ No public matches are waiting right now — create
                one to get started.
              </Note>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflow: 'auto' }}>
                {matches.map(({ match, seatsFilled, totalSeats, status }) => (
                  <MatchRow
                    key={match.matchID}
                    match={match}
                    seatsFilled={seatsFilled}
                    totalSeats={totalSeats}
                    status={status}
                    joining={joiningMatchID === match.matchID}
                    disabled={status !== 'Waiting' || joiningMatchID !== null || isCreating}
                    onJoin={() => void handleJoinMatch(match.matchID)}
                  />
                ))}
              </div>
            )}
          </PaperCard>
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </main>
  );
}
