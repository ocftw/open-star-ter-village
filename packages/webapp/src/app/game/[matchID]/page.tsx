'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Snackbar } from '@mui/material';
import GameView from '@/components/GameView';
import { Modal, StickerButton } from '@/components/design';
import LobbyNav from '@/components/lobby/LobbyNav';
import Note from '@/components/lobby/Note';
import SeatCard from '@/components/lobby/SeatCard';
import { clearCredentials, loadCredentials, type MatchCredentials } from '@/lib/matchCredentials';
import { usePolling } from '@/lib/usePolling';
import { useSnackbar } from '@/lib/useSnackbar';
import {
  getFilledSeatCount,
  getLobbyErrorMessage,
  getMatch,
  hasHostStarted,
  hasPlayerName,
  isMatchNotFoundError,
  leaveRoom,
  startRoom,
  type LobbyMatch,
} from '@/app/lobby/actions';

const MATCH_EXPIRED_MESSAGE = '房間不存在或已過期 · Match not found or expired';

/** Full-screen non-dismissible notice: a player released their seat, ending the match (#420). */
function MatchTerminatedOverlay() {
  return (
    <Modal
      open
      ariaLabel="遊戲已終止"
      role="alertdialog"
      width="min(420px, 100%)"
      dataTestid="match-terminated-overlay"
    >
      <div style={{ textAlign: 'center' }}>
        <div aria-hidden style={{ fontSize: 36 }}>🚪</div>
        <strong style={{ display: 'block', fontSize: 18, marginTop: 8, color: 'var(--ink)' }}>
          有玩家離席，遊戲已終止
        </strong>
        <div className="en-cap" style={{ marginTop: 4 }}>
          A player left their seat — this game has ended
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55, margin: '10px 0 18px' }}>
          這局不會計算勝負。回到大廳開新的一局吧。
        </p>
        <Link href="/lobby" className="btn-sticker" style={{ width: '100%' }}>
          回大廳 <span className="tag-en" style={{ color: 'rgba(255,255,255,0.85)' }}>Back to lobby</span>
        </Link>
      </div>
    </Modal>
  );
}

export default function GameRoomPage() {
  const params = useParams<{ matchID: string }>();
  const router = useRouter();
  const matchID = Array.isArray(params.matchID) ? params.matchID[0] : params.matchID;
  const hasLoaded = React.useRef(false);
  const [match, setMatch] = React.useState<LobbyMatch | null>(null);
  const [credentials, setCredentials] = React.useState<MatchCredentials | null>(null);
  const [credentialsReady, setCredentialsReady] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isExpired, setIsExpired] = React.useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const pollMatch = React.useCallback(async () => {
    try {
      const nextMatch = await getMatch(matchID);
      setMatch(nextMatch);
      setErrorMessage(null);
      hasLoaded.current = true;
    } catch (error) {
      // A missing match must never mount a fresh board under the old URL —
      // show the expired state instead (#419), whether on first load or after
      // the server purged a finished room.
      if (isMatchNotFoundError(error)) {
        clearCredentials(matchID);
        setIsExpired(true);
      } else if (!hasLoaded.current) {
        setErrorMessage(getLobbyErrorMessage(error, 'Unable to load this room.'));
      } else {
        showSnackbar('Connection issue — retrying…', 'info');
      }
    } finally {
      setIsLoading(false);
    }
  }, [matchID, showSnackbar]);

  React.useEffect(() => {
    let cancelled = false;

    setCredentialsReady(false);

    const loadSavedCredentials = async () => {
      const creds = loadCredentials(matchID);

      if (!creds) {
        if (!cancelled) {
          setCredentials(null);
          setCredentialsReady(true);
        }
        return;
      }

      let nextCredentials: MatchCredentials | null = creds;
      const serverMatch = await getMatch(matchID).catch(() => null);

      if (serverMatch) {
        const slot = serverMatch.players.find((player) => player.id === Number(creds.playerID));
        if (!slot?.name || slot.name !== creds.playerName) {
          clearCredentials(matchID);
          nextCredentials = null;
        }
      }

      if (!cancelled) {
        setCredentials(nextCredentials);
        setCredentialsReady(true);
      }
    };

    void loadSavedCredentials();

    return () => {
      cancelled = true;
    };
  }, [matchID]);

  const allSeatsFilled = match ? getFilledSeatCount(match) === match.players.length : false;
  const hasStarted = match ? hasHostStarted(match) : false;
  const isAbandoned = match
    ? match.players.every((player) => !player.name?.trim() || player.isConnected === false)
    : false;
  const isHost = credentials?.playerID === '0';
  // A vacated seat in a started match means someone chose 離開座位 — the
  // game is terminated for everyone (#420). Detected from authoritative
  // lobby metadata (the socket does not push metadata changes mid-game).
  const isTerminated =
    Boolean(match) && hasStarted && match!.players.some((player) => !hasPlayerName(player));
  const shouldShowBoard = Boolean(match) && allSeatsFilled && hasStarted && !isExpired;
  const isMutating = isStarting || isLeaving || isRefreshing;

  // Poll for the whole room lifetime (not just the waiting room): mid-game it
  // detects leave-termination, and after game over it detects the TTL purge so
  // the page switches to the expired state instead of letting the socket
  // silently re-create fresh match state.
  usePolling(pollMatch, 3_000, !isExpired);

  const handleLeaveMatch = async () => {
    if (!credentials) {
      router.push('/lobby');
      return;
    }

    setIsLeaving(true);

    try {
      await leaveRoom(matchID, credentials.playerID, credentials.credential);
      clearCredentials(matchID);
      router.push('/lobby');
    } catch (error) {
      showSnackbar(getLobbyErrorMessage(error, 'Unable to leave the room.'), 'error');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleStartGame = async () => {
    if (!credentials || !isHost) {
      return;
    }

    setIsStarting(true);

    try {
      await startRoom(matchID, credentials.playerID, credentials.credential);
      await pollMatch();
    } catch (error) {
      showSnackbar(getLobbyErrorMessage(error, 'Unable to start the game.'), 'error');
    } finally {
      setIsStarting(false);
    }
  };

  const handleRefreshNow = async () => {
    setIsRefreshing(true);

    try {
      await pollMatch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyInviteURL = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showSnackbar('Invite URL copied!', 'success');
    } catch {
      showSnackbar('Copy failed — select and copy the URL manually.', 'error');
    }
  };

  if (!credentialsReady || isLoading) {
    return (
      <main>
        <LobbyNav />
        <div className="page-pad" style={{ color: 'var(--ink-mute)', fontSize: 14 }}>
          載入房間中… <span className="en-cap">Loading room…</span>
        </div>
      </main>
    );
  }

  if (isExpired || errorMessage) {
    return (
      <main>
        <LobbyNav />
        <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
          <Note tone="error">
            {isExpired ? (
              <span data-testid="match-expired-note">{MATCH_EXPIRED_MESSAGE}</span>
            ) : (
              errorMessage
            )}
          </Note>
          <Link href="/lobby" className="btn-sticker" style={{ alignSelf: 'flex-start' }}>
            回大廳 <span style={{ opacity: 0.8, fontFamily: 'var(--font-en)', fontWeight: 500 }}>· Back to lobby</span>
          </Link>
        </div>
      </main>
    );
  }

  if (match && shouldShowBoard) {
    return (
      <GameView
        isLocal={false}
        matchID={matchID}
        playerID={credentials?.playerID}
        credentials={credentials?.credential}
        numPlayers={match.players.length}
      />
    );
  }

  if (match && isTerminated) {
    // A seat was released mid-game (#420): the board unmounts (the vacated
    // seat empties allSeatsFilled) and every remaining browser lands here.
    return (
      <main>
        <LobbyNav />
        <MatchTerminatedOverlay />
      </main>
    );
  }

  if (match && isAbandoned && !hasStarted) {
    return (
      <main>
        <LobbyNav />
        <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
          <Note tone="info">這個房間已經解散了。 This room was abandoned.</Note>
          <Link href="/lobby" className="btn-sticker" style={{ alignSelf: 'flex-start' }}>
            回大廳 <span style={{ opacity: 0.8, fontFamily: 'var(--font-en)', fontWeight: 500 }}>· Back to lobby</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      <LobbyNav />
      <div className="page-pad">
        <div className="grid-main-rail">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 22, fontWeight: 800 }}>
                等待玩家加入 <span className="en-cap">Waiting room</span>
              </h1>
              <span
                className="sticker"
                style={{ background: 'var(--orange-soft)', borderColor: 'var(--orange)' }}
                data-testid="waiting-for-player-alert"
              >
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--orange)' }} />
                等待中 Waiting
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-soft)' }}>房號</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 800,
                  background: 'white',
                  border: '1.5px solid var(--ink)',
                  borderRadius: 10,
                  padding: '4px 14px',
                  boxShadow: '0 2px 0 var(--ink)',
                  letterSpacing: '0.04em',
                  maxWidth: 360,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {matchID}
              </span>
              <StickerButton variant="ghost" size="sm" onClick={() => void handleCopyInviteURL()}>
                複製連結 · Copy invite link
              </StickerButton>
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {credentials ? (
                <Note tone="success">
                  你的座位是 Seat {credentials.playerID}，等其他人加入中。 Seat {credentials.playerID} is
                  reserved in this browser. Waiting for everyone to join.
                </Note>
              ) : (
                <Note tone="info">
                  這個瀏覽器沒有座位，想入座請從大廳加入。 This browser has no saved seat for the room —
                  join from the lobby to claim one.
                </Note>
              )}

              {allSeatsFilled && !hasStarted && (
                <Note tone={isHost ? 'info' : 'warning'}>
                  {isHost
                    ? '人到齊了！按「開始遊戲」帶大家進牌桌。 All seats are filled — use Start to move everyone into the board.'
                    : '人到齊了，等待房主開始。 All seats are filled. Waiting for the host to start the game.'}
                </Note>
              )}
            </div>

            <div className="grid-seats" style={{ marginTop: 24 }} data-testid="seat-grid">
              {match?.players.map((player) => (
                <SeatCard
                  key={player.id}
                  seatIndex={player.id}
                  playerName={hasPlayerName(player) ? player.name : undefined}
                  isHost={player.id === 0 && hasPlayerName(player)}
                  isYou={credentials?.playerID === String(player.id)}
                />
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-mute)' }}>
              {match
                ? `${getFilledSeatCount(match)} / ${match.players.length} 個座位已入座 · seats filled`
                : '載入座位中… Loading seats…'}
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {isHost && credentials && (
                <StickerButton onClick={handleStartGame} disabled={!allSeatsFilled || isMutating}>
                  {isStarting ? '開始中… · Starting' : '開始遊戲 · Start game'}
                </StickerButton>
              )}
              <StickerButton
                variant="ghost"
                onClick={() => void handleRefreshNow()}
                disabled={isRefreshing}
              >
                {isRefreshing ? '更新中…' : '重新整理 · Refresh'}
              </StickerButton>
              <StickerButton
                variant="dark"
                onClick={() => void handleLeaveMatch()}
                disabled={isMutating}
                style={{ marginLeft: 'auto' }}
              >
                {isLeaving ? '離開中…' : credentials ? '離開 · Leave match' : '回大廳 · Back to lobby'}
              </StickerButton>
            </div>
            {isHost && credentials && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-mute)' }}>
                * 房主在所有座位坐滿後可開始遊戲。
                <span className="en-cap" style={{ marginLeft: 6 }}>
                  Host can start once every seat is filled.
                </span>
              </div>
            )}
          </div>

          {/* Rules-at-a-glance panel */}
          <div className="paper-card" style={{ padding: 22 }}>
            <h2 style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 15, fontWeight: 800 }}>
              這場遊戲的目標 <span className="en-cap">Objective</span>
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)', marginTop: 8 }}>
              收集人力、發起與貢獻開源專案，遊戲結束時影響力分數最高者獲勝。
            </p>
            <div className="dotted" style={{ margin: '14px 0' }} />
            <h2 style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 15, fontWeight: 800 }}>
              一回合三步驟 <span className="en-cap">One round, three steps</span>
            </h2>
            <ol style={{ paddingLeft: 18, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, marginTop: 8 }}>
              <li>翻開事件卡</li>
              <li>所有玩家依序行動</li>
              <li>清算分數，補滿人力</li>
            </ol>
          </div>
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
