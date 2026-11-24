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
} from '@/lib/reducers/actionStepSlice';
import { getSelectedJobSlots } from '@/lib/reducers/jobSlotSlice';
import { getSelectedProjectSlots } from '@/lib/reducers/projectSlotSlice';
import { getContributions } from '@/lib/reducers/contributionSlice';
import { getTotalContributionValue } from '@/game/core/ContributionAction';
import { JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { isLiveSlashWildJobCard, isSlashWildJobCard, requiresAssignedJobName } from '@/game/core/slashWildJob';
import { RuleSelector } from '@/game/store/slice/rule';
import { ProfessionPicker, getEligibleTargetJobNames } from './board/professionPicker';
import { Modal, PLAYER_COLORS, StickerButton, Toast } from '@/components/design';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import { getPlayerName } from './playerNameMap';
import GameHeader from './board/GameHeader';
import HandPanel from './board/HandPanel';
import JobMarket from './board/JobMarket';
import ContextAction from './board/ContextAction';
import { StartProjectContext, useStartProject } from './board/useStartProject';
import { RefillFlowProvider } from './board/RefillFlow';
import DiscardPanel from './board/DiscardPanel';
import WaitingForPlayerAlert from './board/WaitingForPlayerAlert';
import GameOverNote from './board/GameOverNote';
import { isFourFreedomsDiscardPending } from './board/fourFreedomsDiscard';
import { getActionAreaView } from './board/actionAreaView';
import ProjectArea from './board/ProjectArea';
import MobileSheet from './board/MobileSheet';
import { ScorePanel } from './board/SidePanels';
import TurnStrip from './board/TurnStrip';
import GameHistory, { useGameHistory } from './board/GameHistory';
import { useIsMobile } from '@/lib/useIsMobile';
import ProjectCatalogLink from './ProjectCatalogLink';
import RoundStartOverlay from './board/RoundStartOverlay';
import { useRoundStartOverlay } from './board/useRoundStartOverlay';
import { isContributionAction, useContributionFeedback } from './board/useContributionFeedback';

/**
 * Desktop height budget: the upper grid gets whatever the viewport leaves after
 * the sticky header and the bottom row's real border-box height, so the hand
 * and market stay on screen while only the projects scroller scrolls. Published
 * as --board-upper-h and re-measured on resize, font load and content changes.
 */
function useUpperTrackHeight(
  shellRef: React.RefObject<HTMLDivElement>,
  bottomRowRef: React.RefObject<HTMLDivElement>,
  isMobile: boolean,
) {
  React.useLayoutEffect(() => {
    const shell = shellRef.current;
    const bottom = bottomRowRef.current;
    if (isMobile || !shell || !bottom) return;
    const header = shell.querySelector('[data-testid="app-header"]');
    const measure = () => {
      const headerHeight = header?.getBoundingClientRect().height ?? 72;
      const upper = window.innerHeight - headerHeight - bottom.getBoundingClientRect().height;
      shell.style.setProperty('--board-header-h', `${headerHeight}px`);
      shell.style.setProperty('--board-upper-h', `${Math.max(240, Math.floor(upper))}px`);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(bottom);
    Array.from(bottom.children).forEach((child) => observer?.observe(child));
    if (header) observer?.observe(header);
    window.addEventListener('resize', measure);
    void document.fonts?.ready.then(measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [shellRef, bottomRowRef, isMobile]);
}

const Board: React.FC<GameContext> = (gameContext) => {
  const { G, playerID, ctx, matchData } = gameContext;
  const dispatch = useAppDispatch();
  const currentAction = useAppSelector(getCurrentAction);
  const gameover = ctx.gameover as { winners: string[] } | undefined;
  const roundStart = useRoundStartOverlay(gameContext.matchID, G.table.round, !!gameover, G.table.eventSlot !== null);
  const roundStartOverlay = (
    <RoundStartOverlay event={G.table.eventSlot} round={G.table.round} open={roundStart.open} onClose={roundStart.close} />
  );

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
  const startActive = actionAreaView === 'context' && currentAction === UserActionMoves.CreateProject;
  const start = useStartProject(gameContext, startActive);
  const startMountRef = React.useRef<HTMLDivElement>(null);
  const history = useGameHistory(gameContext);
  const projectsRef = React.useRef<HTMLDivElement>(null);
  const [contributionMount, setContributionMount] = React.useState<HTMLDivElement | null>(null);
  const contributions = useAppSelector(getContributions);
  const contributionActive = actionAreaView === 'context' && isContributionAction(currentAction);
  const contributionTotal = contributionActive ? getTotalContributionValue(contributions) : 0;
  const contributionMax = contributionActive ? RuleSelector.getMaxContributionValue(G.rules, currentAction) : null;
  const hasPendingContribution = contributionTotal > 0;
  const { record: recordContribution, feedback: contributionFeedback } = useContributionFeedback(gameContext);
  const [capNotice, setCapNotice] = React.useState<number | null>(null);
  const capSequence = React.useRef(0);
  const closeCapNotice = () => setCapNotice(null);
  React.useLayoutEffect(() => setCapNotice(null), [
    currentAction, ctx.turn, ctx.currentPlayer, playerID, gameContext.matchID,
  ]);
  React.useLayoutEffect(() => {
    if (!hasPendingContribution) setCapNotice(null);
  }, [hasPendingContribution]);

  React.useLayoutEffect(() => {
    const projects = projectsRef.current;
    if (!projects || !contributionMount || isMobile) return;
    const measure = () => {
      const height = contributionMount.offsetHeight;
      projects.style.setProperty('--contribution-bar-space', height ? `${height + 16}px` : '0px');
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(contributionMount);
    return () => {
      observer?.disconnect();
      projects.style.removeProperty('--contribution-bar-space');
    };
  }, [contributionMount, isMobile, hasPendingContribution]);
  const shellRef = React.useRef<HTMLDivElement>(null);
  const bottomRowRef = React.useRef<HTMLDivElement>(null);
  useUpperTrackHeight(shellRef, bottomRowRef, isMobile);

  // 斜槓青年 target-position picker: during Recruit, only when the selected
  // job card is the player's live wild card (legacy games: a mismatched card while
  // the entitlement is unspent), the selected project's eligible rows become targets.
  const jobSelectionMap = useAppSelector(getSelectedJobSlots);
  const projectSelectionMap = useAppSelector(getSelectedProjectSlots);
  const assignedJobName = useAppSelector(getAssignedJobName);
  const selectedJobId = Object.keys(jobSelectionMap).find((id) => jobSelectionMap[id]);
  const selectedJobCard = selectedJobId
    ? JobSlotsSelector.getJobCardById(G.table.jobSlots, selectedJobId)
    : undefined;
  const professionPickerFor = (slot: ProjectSlotState): ProfessionPicker | undefined => {
    if (currentAction !== UserActionMoves.Recruit) return undefined;
    if (playerID === null || !selectedJobCard || !slot.card) return undefined;
    if (!projectSelectionMap[slot.id]) return undefined;
    const needsProfession = isSlashWildJobCard(selectedJobCard)
      ? playerID === ctx.currentPlayer && isLiveSlashWildJobCard(G, ctx.currentPlayer, selectedJobCard)
      : requiresAssignedJobName(G.rules, playerID, selectedJobCard, Object.keys(slot.card.requirements));
    if (!needsProfession) return undefined;
    return {
      eligibleJobNames: getEligibleTargetJobNames(slot, playerID!),
      selectedJobName: assignedJobName,
      onPick: (jobName) => dispatch(setAssignedJobName(assignedJobName === jobName ? null : jobName)),
    };
  };

  const hand = playerID !== null && <HandPanel gameContext={gameContext} layout={isMobile ? 'strip' : 'rail'} />;
  const jobMarket = <JobMarket gameContext={gameContext} idle={idle} discardActive={showDiscardPanel} />;

  // Shared between the desktop right column and the mobile stack.
  const actionArea =
    actionAreaView === 'discard' ? (
      <DiscardPanel gameContext={gameContext} />
    ) : actionAreaView === 'context' ? (
      <ContextAction
        gameContext={gameContext}
        startMountRef={isMobile ? undefined : startMountRef}
        startHand={isMobile ? hand : undefined}
        startMarket={isMobile ? jobMarket : undefined}
        contributionMount={contributionMount}
        onContributionSubmit={recordContribution}
        onContributionCancel={closeCapNotice}
      />
    ) : actionAreaView === 'gameover' ? (
      <GameOverNote onShowResults={() => setShowGameOver(true)} />
    ) : (
      <WaitingForPlayerAlert
        playerName={getPlayerName(matchData, ctx.currentPlayer)}
        pendingDiscard={discardPending}
      />
    );

  const contributionNotice = (
    <Toast
      className="contribution-cap-toast"
      open={hasPendingContribution && capNotice !== null}
      resetKey={capNotice ?? undefined}
      tone="alert"
      duration={2000}
      onClose={closeCapNotice}
    >
      <span data-testid="contribution-cap-notice">已達到貢獻值上限</span>
    </Toast>
  );
  const projectsSection = (
    <div className="contribution-stage" data-testid="contribution-stage">
      <ProjectArea
        gameContext={gameContext}
        projectsRef={projectsRef}
        professionPickerFor={professionPickerFor}
        veiled={startActive}
        contributionMax={contributionMax}
        onContributionCap={() => setCapNotice(++capSequence.current)}
        contributionFeedback={contributionFeedback}
      />
      <div ref={setContributionMount} className="contribution-mount">
        {isMobile && contributionNotice}
      </div>
      {!isMobile && contributionNotice}
    </div>
  );

  const layout = isMobile ? (
    <div
      data-game-board
      data-round-start-ready={roundStart.ready}
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
      <TurnStrip gameContext={gameContext} projectsRef={projectsRef} horizontal />
      <MobileSheet
        action={actionArea}
        hand={hand}
        startActive={startActive}
      />
      <div
        style={{
          flex: 1,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {projectsSection}
        {!startActive && jobMarket}
        <ScorePanel gameContext={gameContext} />
        <GameHistory entries={history} matchData={matchData} />
      </div>

      <GameOverDialog gameContext={gameContext} open={!!gameover && showGameOver} onClose={() => setShowGameOver(false)} />
      {roundStartOverlay}
    </div>
  ) : (
    <div
      data-game-board
      data-round-start-ready={roundStart.ready}
      ref={shellRef}
      className="board-desktop"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--paper)',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(42,36,34,0.06) 1px, transparent 0)',
        backgroundSize: '22px 22px',
      }}
    >
      <GameHeader gameContext={gameContext} />

      <div
        className="board-upper"
        style={{
          display: 'grid',
          gridTemplateColumns: '250px minmax(0, 1fr) 76px 231px',
          position: 'relative',
          gap: 16,
          padding: 16,
          alignItems: 'start',
        }}
      >
        {/* LEFT — ranking and history */}
        <div className="board-col board-col--left">
          <ScorePanel gameContext={gameContext} />
          <GameHistory entries={history} matchData={matchData} />
        </div>

        {/* CENTER — notices + projects */}
        <div className="board-col board-col--center">
          {actionAreaView !== 'context' && actionArea}
          <div ref={startMountRef} className="start-project-mount" />
          {projectsSection}
        </div>

        <TurnStrip gameContext={gameContext} projectsRef={projectsRef} />

        {/* RIGHT — action panel */}
        <div className="board-col board-col--right">
          {actionAreaView === 'context' && actionArea}
        </div>
        {roundStartOverlay}
      </div>

      {/* BOTTOM — hand (players only) beside the job market */}
      <div
        ref={bottomRowRef}
        data-testid="board-bottom-row"
        className={`board-bottom-row${playerID === null ? ' board-bottom-row--observer' : ''}`}
      >
        {hand}
        <div className="board-bottom-row__market">{jobMarket}</div>
      </div>

      <GameOverDialog gameContext={gameContext} open={!!gameover && showGameOver} onClose={() => setShowGameOver(false)} />
    </div>
  );
  return (
    <RefillFlowProvider gameContext={gameContext}>
      <StartProjectContext.Provider value={start}>{layout}</StartProjectContext.Provider>
    </RefillFlowProvider>
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
    const resolvedNumPlayers = isLocal ? (numPlayers ?? 4) : numPlayers;
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
