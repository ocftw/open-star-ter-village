import { Client, BoardProps } from 'boardgame.io/react';
import { SocketIO, Local } from 'boardgame.io/multiplayer'
import game from '@/game';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Game } from 'boardgame.io';
import { GameState, ProjectSlotState } from '@/game';
import { GameContext } from './GameContextHelpers';
import { GAME_NAME, GAME_SERVER_URL, lobbyClient } from '@/lib/lobbyClient';
import { getLobbyErrorMessage, joinRoom } from '@/app/lobby/actions';
import { loadCredentials, saveCredentials, type MatchCredentials } from '@/lib/matchCredentials';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  UserActionMoves,
  getAssignedJobName,
  getCurrentAction,
  setAssignedJobName,
  setCurrentAction,
} from '@/lib/reducers/actionStepSlice';
import { getSelectedJobSlots } from '@/lib/reducers/jobSlotSlice';
import { getSelectedProjectSlots } from '@/lib/reducers/projectSlotSlice';
import { JobSlotsSelector } from '@/game/store/slice/jobSlots';
import { RuleSelector } from '@/game/store/slice/rule';
import { ProfessionPicker, getEligibleTargetJobNames } from './board/professionPicker';
import { Modal, PLAYER_COLORS, StickerButton, ToastProvider, useToast } from '@/components/design';
import { TableSelector } from '@/game/store/slice/table';
import { useHints } from '@/lib/useHints';
import { ScoreBoardSelector } from '@/game/store/slice/scoreBoard';
import { getPlayerName } from './playerNameMap';
import GameHeader from './board/GameHeader';
import HandPanel from './board/HandPanel';
import JobMarket from './board/JobMarket';
import ContextAction from './board/ContextAction';
import DiscardPanel from './board/DiscardPanel';
import BoardProjectSlot from './board/BoardProjectSlot';
import EventBanner from './board/EventBanner';
import MobileSheet from './board/MobileSheet';
import { ScorePanel, TurnOrderPanel } from './board/SidePanels';
import { useIsMobile } from '@/lib/useIsMobile';

const Board: React.FC<GameContext> = (gameContext) => (
  <ToastProvider>
    <BoardInner {...gameContext} />
  </ToastProvider>
);

const BoardInner: React.FC<GameContext> = (gameContext) => {
  const { G, playerID, ctx, matchData } = gameContext;
  const dispatch = useAppDispatch();
  const currentAction = useAppSelector(getCurrentAction);
  const isMyTurn = playerID === ctx.currentPlayer;
  const gameover = ctx.gameover as { winners: string[] } | undefined;

  const [showGameOver, setShowGameOver] = React.useState(true);
  const [hintsOn, toggleHints] = useHints();
  const toast = useToast();

  // Game-event toasts derived from authoritative state transitions so every
  // seat (and observers) see them: round start and project settlement 🎉.
  const round = TableSelector.getRound(G.table);
  const prevRoundRef = React.useRef(round);
  React.useEffect(() => {
    if (round > prevRoundRef.current && round > 1 && !gameover) {
      toast(`🔄 第 ${round} 回合開始 — 行動格已重置。`, 'success', 4500);
    }
    prevRoundRef.current = round;
  }, [round, gameover, toast]);

  const prevSlotCardsRef = React.useRef<Map<string, string>>(new Map());
  React.useEffect(() => {
    const previous = prevSlotCardsRef.current;
    const next = new Map<string, string>();
    G.table.projectBoard.forEach((slot) => {
      if (slot.card) next.set(slot.id, slot.card.name);
    });
    if (!gameover) {
      previous.forEach((name, slotId) => {
        if (!next.has(slotId)) {
          toast(`🎉 「${name}」完成！貢獻者獲得影響力，工人回到玩家手上。`, 'success');
        }
      });
    }
    prevSlotCardsRef.current = next;
    // Safe to re-run on unrelated board updates: the map diff yields nothing.
  }, [G.table.projectBoard, gameover, toast]);
  const isLastPlayer = ctx.playOrderPos === ctx.numPlayers - 1;
  const hasPendingDiscard = G.table.fourFreedomsPendingDiscards.length > 0;
  const outOfAP = playerID != null && (G.players[playerID]?.token?.actions ?? 1) === 0;
  // Show the discard panel instead of the action bar when it's the last player's turn and
  // they need to remove 2 job cards (四大自由), either because AP is exhausted or they have
  // explicitly signalled they are done with their action phase (actionPhaseDone).
  const showDiscardPanel = isMyTurn && isLastPlayer && hasPendingDiscard &&
    (outOfAP || G.table.actionPhaseDone);

  const idle = isMyTurn && currentAction === null && !showDiscardPanel && !gameover;
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
  const actionArea = isMyTurn ? (
    showDiscardPanel ? (
      <DiscardPanel gameContext={gameContext} />
    ) : (
      <ContextAction gameContext={gameContext} />
    )
  ) : (
    playerID !== null && (
      <div
        data-testid="waiting-for-player-alert"
        className="paper-card"
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          color: 'var(--ink-soft)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: 'var(--orange)',
            flexShrink: 0,
          }}
        />
        等待 {getPlayerName(matchData, ctx.currentPlayer)} 行動中… Waiting for{' '}
        {getPlayerName(matchData, ctx.currentPlayer)}…
      </div>
    )
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
        {hintsOn && (
          <span className="hint">ⓘ 點桌上的專案來貢獻</span>
        )}
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

  const jobMarket = (
    <JobMarket gameContext={gameContext} idle={idle} discardActive={showDiscardPanel} showHints={hintsOn} />
  );

  // #419 AC: closing the result dialog must not lose access to the result.
  const viewResultsChip = gameover && !showGameOver && (
    <button
      type="button"
      className="btn-sticker sm"
      data-testid="view-results"
      onClick={() => setShowGameOver(true)}
      style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1300 }}
    >
      🏆 查看結果 <span className="tag-en" style={{ color: 'rgba(255,255,255,0.85)' }}>Results</span>
    </button>
  );

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
      <GameHeader gameContext={gameContext} compact hintsOn={hintsOn} onToggleHints={toggleHints} />
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

      {viewResultsChip}
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
      <GameHeader gameContext={gameContext} hintsOn={hintsOn} onToggleHints={toggleHints} />

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

      {viewResultsChip}
      <GameOverDialog gameContext={gameContext} open={!!gameover && showGameOver} onClose={() => setShowGameOver(false)} />
    </div>
  );
};

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
  React.useEffect(() => {
    if (isMultiplayer && open) {
      setSavedCredentials(loadCredentials(matchID));
    }
  }, [isMultiplayer, matchID, open]);

  const rankedScores = Object.entries(ScoreBoardSelector.getAllPlayerPoints(G.table.scoreBoard)).sort(
    ([, a], [, b]) => b - a,
  );

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
      const joined = await joinRoom(nextMatchID, playerName);
      saveCredentials(joined);
      router.push(`/game/${nextMatchID}`);
    } catch (error) {
      setRematchError(getLobbyErrorMessage(error, '無法開新的一局，請稍後再試。 · Could not start the next game.'));
      setIsRematching(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} ariaLabel="遊戲結束" width="min(440px, 100%)">
      {gameover && (
        <div>
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
              {rankedScores.map(([id, points]) => {
                  const winner = gameover.winners.includes(id);
                  // Competition ranking: equal scores share a rank, the next skips.
                  const rank = rankedScores.findIndex(([, other]) => other === points) + 1;
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
                        data-testid="result-rank"
                        aria-hidden
                        style={{
                          fontFamily: 'var(--font-en)',
                          fontWeight: 800,
                          fontSize: 14,
                          width: 18,
                          color: 'var(--ink-mute)',
                        }}
                      >
                        {rank}
                      </span>
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
                      <span style={{ fontWeight: 700, flex: 1 }}>
                        {getPlayerName(matchData, id)}
                        {id === playerID && (
                          <span style={{ color: 'var(--orange)', marginLeft: 4, fontSize: 11 }}> · YOU</span>
                        )}
                      </span>
                      {winner && <span role="img" aria-label="優勝">👑</span>}
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
                  {isRematching ? '開新一局中…' : '再玩一次'} <span className="tag-en" style={{ color: 'rgba(255,255,255,0.85)' }}>Play again</span>
                </StickerButton>
              )}
              <StickerButton
                variant="ghost"
                onClick={() => router.push('/lobby')}
                disabled={isRematching}
                style={{ flex: 1 }}
              >
                回大廳 <span className="tag-en">Lobby</span>
              </StickerButton>
            </div>
            <StickerButton variant="ghost" size="sm" onClick={onClose} style={{ width: '100%', marginTop: 10 }}>
              關閉，查看最終盤面 · Close and inspect the board
            </StickerButton>
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

  return <BoardgameComponent {...props} />;
}

export default Boardgame;
