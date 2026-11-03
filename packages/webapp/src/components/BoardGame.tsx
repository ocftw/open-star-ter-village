import { Client, BoardProps } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
import game from '@/game';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Game } from 'boardgame.io';
import { GameState, ProjectSlotState } from '@/game';
import { GameContext } from './GameContextHelpers';
import { GAME_NAME, GAME_SERVER_URL, lobbyClient } from '@/lib/lobbyClient';
import { getLobbyErrorMessage, getMatch, hasHostStarted, hasPlayerName, joinRoom } from '@/app/lobby/actions';
import { usePolling } from '@/lib/usePolling';
import { loadCredentials, saveCredentials, type MatchCredentials } from '@/lib/matchCredentials';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  UserActionMoves,
  getAssignedJobName,
  getCurrentAction,
  resetAction,
  setAssignedJobName,
  setCurrentAction,
} from '@/lib/reducers/actionStepSlice';
import { getSelectedJobSlots } from '@/lib/reducers/jobSlotSlice';
import { getSelectedProjectSlots } from '@/lib/reducers/projectSlotSlice';
import { JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { RuleSelector } from '@/game/store/slice/rule';
import { ProfessionPicker, getEligibleTargetJobNames } from './board/professionPicker';
import { Modal, PLAYER_COLORS, StickerButton } from '@/components/design';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import { getPlayerName } from './playerNameMap';
import GameHeader from './board/GameHeader';
import HandPanel from './board/HandPanel';
import JobMarket from './board/JobMarket';
import ContextAction from './board/ContextAction';
import DiscardPanel from './board/DiscardPanel';
import WaitingForPlayerAlert from './board/WaitingForPlayerAlert';
import GameOverNote from './board/GameOverNote';
import { isFourFreedomsDiscardPending } from './board/fourFreedomsDiscard';
import { getActionAreaView } from './board/actionAreaView';
import BoardProjectSlot from './board/BoardProjectSlot';
import EventBanner from './board/EventBanner';
import MobileSheet from './board/MobileSheet';
import { ScorePanel, TurnOrderPanel } from './board/SidePanels';
import { useIsMobile } from '@/lib/useIsMobile';
import ProjectCatalogLink from './ProjectCatalogLink';

const Board: React.FC<GameContext> = (gameContext) => {
  const { G, playerID, ctx, matchData } = gameContext;
  const dispatch = useAppDispatch();
  const currentAction = useAppSelector(getCurrentAction);
  const gameover = ctx.gameover as { winners: string[] } | undefined;

  const [showGameOver, setShowGameOver] = React.useState(true);
  // 四大自由: the last player owes a 2-card discard. They get the discard panel instead of
  // the action bar; everyone else, observers included, sees who the round is waiting on.
  // After game over everyone gets the game-over note instead.
  const discardPending = isFourFreedomsDiscardPending(G, ctx);
  const actionAreaView = getActionAreaView(playerID, ctx.currentPlayer, {
    discardPending,
    gameOver: !!gameover,
  });
  const showDiscardPanel = actionAreaView === 'discard';

  const idle = actionAreaView === 'context' && currentAction === null && !gameover;
  // The game-over note replaces ContextAction and its 取消 button, so drop any
  // half-built action rather than leave its cards selectable.
  const hasEnded = gameover !== undefined;
  React.useEffect(() => {
    if (hasEnded) dispatch(resetAction());
  }, [hasEnded, dispatch]);
  const isMobile = useIsMobile();

  // 斜槓青年 target-position picker: during Recruit with a mismatched
  // job card and the event entitlement available, the selected project's
  // eligible requirement rows become tappable targets.
  const jobSelectionMap = useAppSelector(getSelectedJobSlots);
  const projectSelectionMap = useAppSelector(getSelectedProjectSlots);
  const assignedJobName = useAppSelector(getAssignedJobName);
  const selectedJobId = Object.keys(jobSelectionMap).find((id) => jobSelectionMap[id]);
  const selectedJobCard = selectedJobId
    ? JobSlotsSelector.getJobCardById(G.table.jobSlots, selectedJobId)
    : undefined;
  const overrideAvailable =
    playerID !== null && RuleSelector.canIgnoreFirstWorkerRequirement(G.rules, playerID);
  const professionPickerFor = (slot: ProjectSlotState): ProfessionPicker | undefined => {
    if (currentAction !== UserActionMoves.Recruit) return undefined;
    if (!overrideAvailable || !selectedJobCard || !slot.card) return undefined;
    if (!projectSelectionMap[slot.id]) return undefined;
    if (Object.keys(slot.card.requirements).includes(selectedJobCard.name)) return undefined;
    return {
      eligibleJobNames: getEligibleTargetJobNames(slot, playerID!),
      selectedJobName: assignedJobName,
      onPick: (jobName) => dispatch(setAssignedJobName(assignedJobName === jobName ? null : jobName)),
    };
  };

  // Idle tap on a board project → contribute; ownership picks the move.
  const handleProjectIdleTap = (slot: ProjectSlotState) => {
    if (playerID === null) return;
    dispatch(
      setCurrentAction(
        slot.owner === playerID
          ? UserActionMoves.ContributeOwnedProjects
          : UserActionMoves.ContributeJoinedProjects,
      ),
    );
  };

  // Shared between the desktop layout and the mobile bottom sheet.
  const actionArea =
    actionAreaView === 'discard' ? (
      <DiscardPanel gameContext={gameContext} />
    ) : actionAreaView === 'context' ? (
      <ContextAction gameContext={gameContext} />
    ) : actionAreaView === 'gameover' ? (
      <GameOverNote onShowResults={() => setShowGameOver(true)} />
    ) : (
      <WaitingForPlayerAlert
        playerName={getPlayerName(matchData, ctx.currentPlayer)}
        pendingDiscard={discardPending}
      />
    );

  // Only occupied slots take card space; capacity is one compact indicator (F-003).
  const occupiedSlots = G.table.projectBoard.filter((slot) => slot.card);
  const slotCapacity = G.table.projectBoard.length;
  const slotsAvailable = slotCapacity - occupiedSlots.length;

  const projectsSection = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 4, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 800, fontSize: 14 }}>專案區</span>
          <span className="en-cap">Projects</span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: 'var(--ink-mute)',
            background: 'white',
            border: '1.5px solid var(--paper-3)',
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          ⓘ 點桌上的專案來貢獻
        </span>
        <span
          className="sticker"
          data-testid="project-capacity"
          data-available={slotsAvailable}
          style={
            slotsAvailable === 0
              ? { background: 'var(--orange-soft)', borderColor: 'var(--orange-deep)', color: 'var(--orange-deep)' }
              : undefined
          }
        >
          {slotsAvailable > 0
            ? `專案空位 ${slotsAvailable}/${slotCapacity} · ${slotsAvailable} slots available`
            : '專案區已滿 · No slots available'}
        </span>
      </div>
      {occupiedSlots.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
            marginTop: 12,
          }}
        >
          {occupiedSlots.map((slot) => (
            <BoardProjectSlot
              key={slot.id}
              slot={slot}
              playerID={playerID}
              matchData={matchData}
              idle={idle}
              onIdleTap={handleProjectIdleTap}
              professionPicker={professionPickerFor(slot)}
            />
          ))}
        </div>
      ) : (
        <div
          className="hatch"
          style={{
            marginTop: 12,
            border: '2px dashed var(--ink-mute)',
            borderRadius: 18,
            padding: '18px 16px',
            textAlign: 'center',
            color: 'var(--ink-mute)',
            fontSize: 12,
          }}
        >
          還沒有專案 — 點手牌發起第一個專案。 No projects yet — tap a hand card to create one.
        </div>
      )}
    </div>
  );

  const jobMarket = <JobMarket gameContext={gameContext} idle={idle} discardActive={showDiscardPanel} />;

  return isMobile ? (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper)',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(42,36,34,0.06) 1px, transparent 0)',
        backgroundSize: '22px 22px',
      }}
    >
      <GameHeader gameContext={gameContext} compact />
      <div
        style={{
          flex: 1,
          padding: '12px 12px 280px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {G.table.eventSlot && <EventBanner event={G.table.eventSlot} />}
        {projectsSection}
        {jobMarket}
        <ScorePanel gameContext={gameContext} />
      </div>
      <MobileSheet
        action={actionArea}
        hand={playerID !== null && <HandPanel gameContext={gameContext} idle={idle} layout="strip" />}
      />

      <GameOverDialog gameContext={gameContext} open={!!gameover && showGameOver} onClose={() => setShowGameOver(false)} />
    </div>
  ) : (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper)',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(42,36,34,0.06) 1px, transparent 0)',
        backgroundSize: '22px 22px',
      }}
    >
      <GameHeader gameContext={gameContext} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: playerID !== null ? '250px 1fr 260px' : '1fr 260px',
          gap: 16,
          padding: 16,
          flex: 1,
          alignItems: 'start',
        }}
      >
        {/* LEFT — hand + event (players only) */}
        {playerID !== null && <HandPanel gameContext={gameContext} idle={idle} />}

        {/* CENTER — contextual action + projects + job market */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {actionArea}
          {projectsSection}
          {jobMarket}
        </div>

        {/* RIGHT — score + turn order */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ScorePanel gameContext={gameContext} />
          <TurnOrderPanel gameContext={gameContext} />
        </div>
      </div>

      <GameOverDialog gameContext={gameContext} open={!!gameover && showGameOver} onClose={() => setShowGameOver(false)} />
    </div>
  );
};

// Offline dev games run on Local(), where boardgame.io still reports
// isMultiplayer; observers following the next room (#373) need the lobby server.
const LocalGameContext = React.createContext(false);

// playAgain publishes nextMatchID before its caller has taken a seat, and the
// opener can leave again; the next room only counts as open for observers
// (#373) once its host seat is held — an empty room reads as abandoned. A
// started room with a vacated seat was terminated (#420); a deleted one is gone.
async function isNextRoomOpen(matchID: string): Promise<boolean> {
  try {
    const match = await getMatch(matchID);
    const hostSeated = match.players.some(player => player.id === 0 && hasPlayerName(player));
    const terminated = !match.gameover && hasHostStarted(match) && match.players.some(player => !hasPlayerName(player));
    return hostSeated && !terminated;
  } catch {
    return false;
  }
}

export function GameOverDialog({
  gameContext,
  open,
  onClose,
}: {
  gameContext: GameContext;
  open: boolean;
  onClose: () => void;
}) {
  const { G, ctx, matchData, matchID, isMultiplayer, playerID } = gameContext;
  const gameover = ctx.gameover as { winners: string[] } | undefined;
  const router = useRouter();

  // 再玩一次 (#419): playAgain keeps everyone who clicks in the same next
  // match. Credentials come from the per-match localStorage entry (the board
  // props do not expose them), read client-side only.
  const [savedCredentials, setSavedCredentials] = React.useState<MatchCredentials | null>(null);
  const [isRematching, setIsRematching] = React.useState(false);
  const [rematchError, setRematchError] = React.useState<string | null>(null);
  const [nextMatchID, setNextMatchID] = React.useState<string | null>(null);
  const [dismissedInvitation, setDismissedInvitation] = React.useState<string | null>(null);
  const hasFinished = gameover !== undefined;
  // Observers (#373) cannot playAgain without a seat. 繼續觀戰 arms a move
  // into the next room as a spectator as soon as a player opens it; once it
  // is open the button becomes 加入觀戰. Seats are picked in that room.
  const isLocalGame = React.useContext(LocalGameContext);
  const isObserver = isMultiplayer && !isLocalGame && playerID === null;
  // Kept per tab in sessionStorage so a remount or refresh stays armed.
  const keepWatchingKey = `open-star-ter-village.keep-watching.${matchID}`;
  const [keepWatching, setKeepWatching] = React.useState(false);
  React.useEffect(() => {
    setSavedCredentials(isMultiplayer && hasFinished ? loadCredentials(matchID) : null);
    setNextMatchID(null);
    setDismissedInvitation(null);
    setRematchError(null);
  }, [isMultiplayer, matchID, hasFinished]);
  React.useEffect(() => {
    setKeepWatching(sessionStorage.getItem(keepWatchingKey) === 'true');
  }, [keepWatchingKey]);

  // playAgain persists this on the completed match, so peers recover the
  // invitation after refresh/reconnect even if they closed the result dialog.
  usePolling(async () => {
    const metadata = await getMatch(matchID);
    let invitation = metadata.nextMatchID ?? null;
    if (invitation && isObserver && !(await isNextRoomOpen(invitation))) invitation = null;
    if (invitation !== nextMatchID) setNextMatchID(invitation);
  }, 3_000, isMultiplayer && hasFinished && (savedCredentials !== null || isObserver));
  const invitationVisible = nextMatchID !== null && dismissedInvitation !== nextMatchID;
  React.useEffect(() => {
    if (!isObserver || !keepWatching || !nextMatchID) return;
    sessionStorage.removeItem(keepWatchingKey);
    router.push(`/game/${nextMatchID}`);
  }, [isObserver, keepWatching, keepWatchingKey, nextMatchID, router]);
  const handleClose = () => {
    setDismissedInvitation(nextMatchID);
    onClose();
  };

  const handlePlayAgain = async () => {
    if (!savedCredentials) return;
    setIsRematching(true);
    setRematchError(null);
    try {
      const { nextMatchID } = await lobbyClient.playAgain(GAME_NAME, matchID, {
        playerID: savedCredentials.playerID,
        credentials: savedCredentials.credential,
      });
      const playerName = savedCredentials.playerName ?? getPlayerName(matchData, savedCredentials.playerID);
      const existingCredentials = loadCredentials(nextMatchID);
      const nextMatch = await getMatch(nextMatchID);
      const existingSeat = existingCredentials && nextMatch.players.find(
        player => String(player.id) === existingCredentials.playerID && player.name === playerName,
      );
      if (!existingSeat) {
        const joined = await joinRoom(nextMatchID, playerName);
        saveCredentials(joined);
      }
      router.push(`/game/${nextMatchID}`);
    } catch (error) {
      setRematchError(getLobbyErrorMessage(error, '無法開新的一局，請稍後再試。 · Could not start the next game.'));
      setIsRematching(false);
    }
  };

  const handleObserverWatch = async () => {
    if (nextMatchID) {
      // The room may have closed since the last poll.
      if (await isNextRoomOpen(nextMatchID)) router.push(`/game/${nextMatchID}`);
      else setNextMatchID(null);
    } else {
      if (keepWatching) sessionStorage.removeItem(keepWatchingKey);
      else sessionStorage.setItem(keepWatchingKey, 'true');
      setKeepWatching(!keepWatching);
    }
  };
  const waitingForNextRoom = keepWatching && !nextMatchID;

  return (
    <Modal open={open || invitationVisible} onClose={handleClose} ariaLabel="遊戲結束" width="min(440px, 100%)">
      {gameover && (
        <div>
          {invitationVisible && (
            <div role="status" data-testid="rematch-invitation" style={{ background: 'var(--teal-soft)', borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <strong>{isObserver ? '下一局房間已開好，可以加入觀戰了！' : '下一局已開好，一起再玩一局吧！'}</strong>
              <div className="en-cap">{isObserver ? 'The next room is open — you can watch it' : 'The next game is ready — join your group'}</div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>🏆</div>
              <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--ink)' }}>遊戲結束</h2>
              <div className="en-cap" style={{ marginTop: 2 }}>
                Game over
              </div>
              <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--ink-soft)' }}>
                {gameover.winners.length > 1
                  ? `平手：${gameover.winners.map((id) => getPlayerName(matchData, id)).join('、')}`
                  : `${getPlayerName(matchData, gameover.winners[0])} 獲勝！`}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
              {Object.entries(ScoreBoardSelector.getAllPlayerPoints(G.table.scoreBoard))
                .sort(([, a], [, b]) => b - a)
                .map(([id, points]) => {
                  const winner = gameover.winners.includes(id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        background: winner ? 'var(--orange-soft)' : 'white',
                        border: winner ? '2px solid var(--orange)' : '1.5px solid var(--ink)',
                        borderRadius: 12,
                        boxShadow: '0 2px 0 var(--ink)',
                      }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          background: PLAYER_COLORS[Number(id) % PLAYER_COLORS.length],
                          color: 'white',
                          border: '1.5px solid var(--ink)',
                          display: 'grid',
                          placeItems: 'center',
                          fontFamily: 'var(--font-en)',
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {getPlayerName(matchData, id)[0]}
                      </span>
                      <span style={{ fontWeight: 700, flex: 1 }}>{getPlayerName(matchData, id)}</span>
                      <strong style={{ fontFamily: 'var(--font-en)' }}>{points} VP</strong>
                    </div>
                  );
                })}
            </div>
            {rematchError && (
              <div
                role="alert"
                style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--orange-deep)' }}
              >
                ⚠ {rematchError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {savedCredentials && (
                <StickerButton
                  onClick={() => void handlePlayAgain()}
                  disabled={isRematching}
                  style={{ flex: 1 }}
                  data-testid="play-again"
                >
                  {isRematching ? '加入中…' : nextMatchID ? '加入下一局' : '再玩一次'} <span className="tag-en" style={{ color: 'rgba(255,255,255,0.85)' }}>{nextMatchID ? 'Join next game' : 'Play again'}</span>
                </StickerButton>
              )}
              {isObserver && (
                <StickerButton
                  onClick={() => void handleObserverWatch()}
                  aria-pressed={nextMatchID ? undefined : keepWatching}
                  className={waitingForNextRoom ? 'armed' : undefined}
                  style={{ flex: 1 }}
                  data-testid="observer-watch"
                >
                  {nextMatchID ? (
                    <>加入觀戰 <span className="tag-en" style={{ color: 'rgba(255,255,255,0.85)' }}>Watch next</span></>
                  ) : (
                    <>繼續觀戰 <span className="tag-en" style={{ color: 'rgba(255,255,255,0.85)' }}>Watch on</span></>
                  )}
                </StickerButton>
              )}
              <StickerButton
                variant="ghost"
                onClick={() => {
                  // Leaving for the lobby drops 繼續觀戰 so Back cannot pull the observer onward.
                  sessionStorage.removeItem(keepWatchingKey);
                  router.push('/lobby');
                }}
                disabled={isRematching}
                style={{ flex: 1 }}
              >
                回大廳 <span className="tag-en">Lobby</span>
              </StickerButton>
            </div>
            {waitingForNextRoom && (
              <div
                role="status"
                data-testid="observer-waiting"
                style={{ marginTop: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}
              >
                ⏳ 等待玩家開啟下一局房間
                <div className="en-cap">Waiting for a player to open the next room</div>
              </div>
            )}
            <StickerButton variant="ghost" size="sm" onClick={handleClose} style={{ width: '100%', marginTop: 10 }}>
              關閉，查看最終盤面 · Close and inspect the board
            </StickerButton>
            <ProjectCatalogLink
              placement="game_over"
              className="btn-sticker ghost sm"
              style={{ display: 'block', width: '100%', marginTop: 10, textAlign: 'center' }}
            >
              探索專案卡 · Explore project cards
            </ProjectCatalogLink>
          </div>
        )}
    </Modal>
  );
}

type OwnProps = {
  isLocal: boolean;
  credentials?: string;
  numPlayers?: number;
  /** Optional game config override. Must be a stable reference — all instances sharing
   *  a matchID should pass the SAME object so boardgame.io's LocalMaster is shared. */
  gameConfig?: Game<GameState>;
}

type Props = OwnProps & React.ComponentProps<ReturnType<typeof Client>>;

const Boardgame: React.FC<Props> = ({ isLocal, gameConfig, numPlayers, ...props }) => {
  // Memoize so Client() is called once per mount, not every render.
  // Creating a new class from Client() on every render causes React to see a new component
  // type, unmounting and remounting — which resets the game state.
  const BoardgameComponent = React.useMemo(() => {
    const multiplayer = isLocal ? Local() : SocketIO({ server: GAME_SERVER_URL });
    const resolvedNumPlayers = isLocal ? (numPlayers ?? 3) : numPlayers;
    // Board expects ClientGameState (after playerView strips decks), but Client() couples
    // game + board generics to GameState. The cast is safe because boardgame.io always runs
    // playerView before passing state to the board component.
    return Client({
      game: gameConfig ?? game,
      board: Board as React.FC<BoardProps<GameState>>,
      multiplayer,
      numPlayers: resolvedNumPlayers,
      debug: false,
    });
  }, [isLocal, gameConfig, numPlayers]);

  return (
    <LocalGameContext.Provider value={isLocal}>
      <BoardgameComponent {...props} />
    </LocalGameContext.Provider>
  );
}

export default Boardgame;
