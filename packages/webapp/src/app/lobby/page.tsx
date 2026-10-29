'use client';

import React from 'react';
import { DEFAULT_STANDARD_OPTIONS, FEATURE_KEYS, PROTOTYPE_FEATURES, StandardOptions, TREE_PRESETS, standardOptionsLabel, standardRoundCount } from '@/game/standard/options';
import { STANDARD_RULES_ENABLED, Ruleset, StandardExperiments, DEFAULT_EXPERIMENTS } from '@/game/standard/config';
import { useRouter } from 'next/navigation';
import { Alert, Snackbar } from '@mui/material';
import { PaperCard, StickerButton } from '@/components/design';
import Field from '@/components/lobby/Field';
import LobbyNav from '@/components/lobby/LobbyNav';
import MatchRow from '@/components/lobby/MatchRow';
import Note from '@/components/lobby/Note';
import Segmented from '@/components/lobby/Segmented';
import { loadCredentials, saveCredentials, type MatchCredentials } from '@/lib/matchCredentials';
import { useLobbyUpdates } from '@/lib/useLobbyUpdates';
import { useSnackbar } from '@/lib/useSnackbar';
import GameIntentTracker from '@/components/GameIntentTracker';
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

export default function LobbyPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = React.useState('');
  const [ruleset, setRuleset] = React.useState<Ruleset>('simple');
  const [experiments, setExperiments] = React.useState<StandardExperiments>({...DEFAULT_EXPERIMENTS, government5: 'any'});
  const [standardOptions, setStandardOptions] = React.useState<StandardOptions>({...DEFAULT_STANDARD_OPTIONS});
  const playerCounts = ruleset === 'tree-poc-v1' ? [2, 3, 4] : PLAYER_COUNT_OPTIONS;
  const [numPlayers, setNumPlayers] = React.useState<number>(3);
  const [matches, setMatches] = React.useState<VisibleMatch[]>([]);
  const [mySeatMatchIDs, setMySeatMatchIDs] = React.useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [joiningMatchID, setJoiningMatchID] = React.useState<string | null>(null);
  const fetchSequence = React.useRef(0);
  const hasSuccessfulFetch = React.useRef(false);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const trimmedPlayerName = playerName.trim();
  const playerNameIsValid = isValidPlayerName(playerName);

  const fetchMatches = React.useCallback(async (silent = false): Promise<boolean> => {
    const requestSequence = ++fetchSequence.current;
    try {
      const nextMatches = await listPublicMatches((matchID) => loadCredentials(matchID) !== null);
      if (requestSequence !== fetchSequence.current) return false;
      hasSuccessfulFetch.current = true;
      setMatches(nextMatches);
      // Rooms this browser still holds a seat credential for get 回到桌子
      // instead of Join (#421). Validity is re-checked by the room page —
      // never inferred from display names.
      setMySeatMatchIDs(
        Object.fromEntries(
          nextMatches
            .filter(({ match }) => loadCredentials(match.matchID) !== null)
            .map(({ match }) => [match.matchID, true]),
        ),
      );
      setLoadError(false);
      return true;
    } catch (error) {
      // Keep reporting the initial load failure even if a newer SSE retry has
      // already started. Once any request succeeds, ignore failures from older
      // requests so they cannot obscure the current room list.
      if (!hasSuccessfulFetch.current || (requestSequence === fetchSequence.current && !silent)) {
        setLoadError(true);
        showSnackbar(getLobbyErrorMessage(error, 'Unable to load matches.'), 'error');
      }
      return false;
    } finally {
      if (requestSequence === fetchSequence.current) setIsLoading(false);
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

  useLobbyUpdates(React.useCallback(() => fetchMatches(true), [fetchMatches]));

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
      const credentials = await createRoom(trimmedPlayerName, numPlayers, ruleset, ruleset === 'tree-poc-v1' ? experiments : undefined, ruleset === 'tree-poc-v1' ? standardOptions : undefined);
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
      <GameIntentTracker />
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
              {STANDARD_RULES_ENABLED && <label>遊戲規則 · Rules
                <select style={{ display: 'block', width: '100%', minWidth: 0, marginTop: 6, padding: 8 }} aria-label="遊戲規則" value={ruleset} disabled={isCreating} onChange={e => {
                  setRuleset(e.target.value as Ruleset); setNumPlayers(3);
                }}>
                  <option value="simple">簡易模式 · Simplified</option>
                  <option value="tree-poc-v1">標準模式 — 星源樹測試版 v1</option>
                </select>
              </label>}
              {ruleset === 'tree-poc-v1' && <>
                <fieldset disabled={isCreating}>
                  <legend>先手輪替</legend>
                  {(['none', 'clockwise', 'counterclockwise'] as const).map(value => <label key={value} style={{ display: 'inline-block', padding: 8 }}><input type="radio" name="starterRotation" value={value} checked={standardOptions.starterRotation === value} onChange={() => setStandardOptions({...standardOptions, starterRotation: value})} />{{none:'不輪替',clockwise:'順時針',counterclockwise:'逆時針'}[value]}</label>)}
                </fieldset>
                <fieldset disabled={isCreating}>
                  <legend>額外回合</legend>
                  {([0, 1, 2] as const).map(value => <label key={value} style={{ display: 'inline-block', padding: 8 }}><input type="radio" name="extraRounds" value={value} checked={standardOptions.extraRounds === value} onChange={() => setStandardOptions({...standardOptions, extraRounds: value})} />+{value} 輪</label>)}
                </fieldset>
                <fieldset disabled={isCreating}>
                  <legend>星源樹門檻 · 第 1～5 層</legend>
                  {(Object.keys(TREE_PRESETS) as StandardOptions['treePreset'][]).map(value => <label key={value} style={{ display: 'block', padding: 8 }}><input type="radio" name="treePreset" value={value} checked={standardOptions.treePreset === value} onChange={() => setStandardOptions({...standardOptions, treePreset: value})} />{TREE_PRESETS[value].metric === 'cc' ? '結案複雜度 CC' : '結案數'} {TREE_PRESETS[value].thresholds.join('／')}</label>)}
                </fieldset>
                {FEATURE_KEYS.map(key => {
                  const values = PROTOTYPE_FEATURES[key].values as Record<string, string>;
                  return <fieldset key={key} disabled={isCreating}>
                    <legend>{PROTOTYPE_FEATURES[key].label}</legend>
                    {Object.keys(values).map(value => <label key={value} style={{ display: 'inline-block', padding: 8 }}><input type="radio" name={key} value={value} checked={standardOptions[key] === value} onChange={() => setStandardOptions({...standardOptions, [key]: value})} />{values[value]}{value === DEFAULT_STANDARD_OPTIONS[key] ? '（原規則）' : '（實驗）'}</label>)}
                    <p style={{ margin: '0 8px 8px' }}>{PROTOTYPE_FEATURES[key].hint}</p>
                  </fieldset>;
                })}
                <p>政府 5：可新增自己的方塊。每個新方塊消耗 1 個庫存人力方塊，不消耗人力卡或 AP；增加既有方塊貢獻不再消耗庫存。</p>
                <label>發起／結案獎勵
                  <select style={{ display: 'block', width: '100%', minWidth: 0, marginTop: 6, padding: 8 }} aria-label="發起／結案獎勵" disabled={isCreating} value={experiments.completionRewards} onChange={e => setExperiments({...experiments, completionRewards:e.target.value as StandardExperiments['completionRewards']})}>
                    <option value="fixed">各 +2（原規則）</option>
                    <option value="difficulty">各依專案星數 +1～+4（實驗）</option>
                  </select>
                </label>
                <p aria-live="polite">共 {standardRoundCount(numPlayers, standardOptions)} 輪（含最終事件） · {standardOptionsLabel(standardOptions)}。建立後固定，再來一局沿用設定。年度結算的發起人額外 +2 仍照常加計。</p>
              </>}
              <Segmented
                label="玩家人數 · Players"
                options={playerCounts}
                value={numPlayers}
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
                    hasSeat={Boolean(mySeatMatchIDs[match.matchID])}
                    joining={joiningMatchID === match.matchID}
                    busy={joiningMatchID !== null || isCreating}
                    onJoin={() => void handleJoinMatch(match.matchID)}
                    onOpen={() => router.push(`/game/${match.matchID}`)}
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
