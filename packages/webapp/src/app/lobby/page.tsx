'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { saveCredentials } from '@/lib/matchCredentials';
import {
  createRoom,
  getLobbyErrorMessage,
  getMatch,
  getOpenSeatID,
  joinRoom,
  listPublicMatches,
  type VisibleMatch,
} from './actions';

const PLAYER_NAME_STORAGE_KEY = 'open-star-ter-village.player-name';
const PLAYER_COUNT_OPTIONS = [3, 4, 5, 6] as const;

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
};

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

export default function LobbyPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = React.useState('');
  const [numPlayers, setNumPlayers] = React.useState<number>(3);
  const [matches, setMatches] = React.useState<VisibleMatch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [joiningMatchID, setJoiningMatchID] = React.useState<string | null>(null);
  const [snackbar, setSnackbar] = React.useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const trimmedPlayerName = playerName.trim();
  const playerNameIsValid = isValidPlayerName(playerName);

  const showSnackbar = React.useCallback((message: string, severity: SnackbarState['severity']) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadMatches = React.useCallback(async (silent = false, shouldIgnore?: () => boolean) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const nextMatches = await listPublicMatches();
      if (!shouldIgnore?.()) {
        setMatches(nextMatches);
      }
    } catch (error) {
      if (!shouldIgnore?.()) {
        showSnackbar(getLobbyErrorMessage(error, 'Unable to load matches.'), 'error');
      }
    } finally {
      if (!silent && !shouldIgnore?.()) {
        setIsLoading(false);
      }
    }
  }, [showSnackbar]);

  React.useEffect(() => {
    const storedPlayerName = localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
    if (storedPlayerName) {
      setPlayerName(storedPlayerName);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const load = async (silent = false) => {
      await loadMatches(silent, () => cancelled);
    };

    void load();
    const intervalID = window.setInterval(() => {
      if (!cancelled) {
        void load(true);
      }
    }, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalID);
    };
  }, [loadMatches]);

  const handlePlayerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setPlayerName(nextValue);
    localStorage.setItem(PLAYER_NAME_STORAGE_KEY, nextValue);
  };

  const handleRefreshMatches = async () => {
    setIsRefreshing(true);

    try {
      await loadMatches(true);
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

    setJoiningMatchID(matchID);

    try {
      const match = await getMatch(matchID);
      const openSeatID = getOpenSeatID(match);

      if (!openSeatID) {
        showSnackbar('This match is already full.', 'info');
        await loadMatches(true);
        return;
      }

      const credentials = await joinRoom(matchID, trimmedPlayerName, openSeatID);
      saveCredentials(credentials);
      router.push(`/game/${matchID}`);
    } catch (error) {
      showSnackbar(getLobbyErrorMessage(error, 'Unable to join that match.'), 'error');
      await loadMatches(true);
    } finally {
      setJoiningMatchID(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Play Online
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
              Create a public room, share the room link, and let the host start the live board once every seat is filled.
            </Typography>
          </Box>
          <Button component={Link} href="/" variant="outlined">
            Back Home
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h5" component="h2">
                    Create Match
                  </Typography>
                  <TextField
                    label="Player Name"
                    value={playerName}
                    onChange={handlePlayerNameChange}
                    error={playerName.length > 0 && !playerNameIsValid}
                    helperText="Use 1 to 20 visible characters."
                    fullWidth
                  />
                  <TextField
                    select
                    label="Players"
                    value={numPlayers}
                    onChange={(event) => setNumPlayers(Number(event.target.value))}
                    fullWidth
                  >
                    {PLAYER_COUNT_OPTIONS.map((count) => (
                      <MenuItem key={count} value={count}>
                        {count} players
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button onClick={handleCreateMatch} variant="contained" disabled={isCreating} fullWidth>
                  {isCreating ? 'Creating…' : 'Create Game'}
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h5" component="h2">
                      Public Matches
                    </Typography>
                    <Button onClick={() => void handleRefreshMatches()} variant="text" disabled={isRefreshing}>
                      {isRefreshing ? 'Refreshing…' : 'Refresh'}
                    </Button>
                  </Box>

                  {isLoading ? (
                    <Typography color="text.secondary">Loading matches…</Typography>
                  ) : matches.length === 0 ? (
                    <Alert severity="info">No public matches are waiting right now. Create one to get started.</Alert>
                  ) : (
                    <Stack spacing={2}>
                      {matches.map(({ match, seatsFilled, totalSeats, status }) => (
                        <Card key={match.matchID} variant="outlined">
                          <CardContent>
                            <Stack spacing={1.5}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="h6" component="h3" sx={{ fontFamily: 'monospace' }}>
                                  {match.matchID}
                                </Typography>
                                <Chip
                                  label={status}
                                  color={status === 'Waiting' ? 'success' : 'default'}
                                  size="small"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Seats filled: {seatsFilled} / {totalSeats}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Created: {formatDate(match.createdAt)}
                              </Typography>
                            </Stack>
                          </CardContent>
                          <CardActions sx={{ px: 2, pb: 2 }}>
                            <Button
                              onClick={() => void handleJoinMatch(match.matchID)}
                              variant="contained"
                              disabled={status !== 'Waiting' || joiningMatchID !== null}
                            >
                              {joiningMatchID === match.matchID ? 'Joining…' : 'Join'}
                            </Button>
                          </CardActions>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
