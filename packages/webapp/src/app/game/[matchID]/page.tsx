'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Boardgame from '@/components/BoardGame';
import { clearCredentials, loadCredentials, type MatchCredentials } from '@/lib/matchCredentials';
import { usePolling } from '@/lib/usePolling';
import { useSnackbar } from '@/lib/useSnackbar';
import {
  getFilledSeatCount,
  getLobbyErrorMessage,
  getMatch,
  hasHostStarted,
  hasPlayerName,
  leaveRoom,
  startRoom,
  type LobbyMatch,
} from '@/app/lobby/actions';

export default function GameRoomPage() {
  const params = useParams<{ matchID: string }>();
  const router = useRouter();
  const matchID = Array.isArray(params.matchID) ? params.matchID[0] : params.matchID;
  const [match, setMatch] = React.useState<LobbyMatch | null>(null);
  const [credentials, setCredentials] = React.useState<MatchCredentials | null>(null);
  const [credentialsReady, setCredentialsReady] = React.useState(false);
  const [inviteURL, setInviteURL] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const pollMatch = React.useCallback(async () => {
    try {
      const nextMatch = await getMatch(matchID);
      setMatch(nextMatch);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getLobbyErrorMessage(error, 'Unable to load this room.'));
    } finally {
      setIsLoading(false);
    }
  }, [matchID]);

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
        if (!slot?.name) {
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

  React.useEffect(() => {
    setInviteURL(window.location.href);
  }, []);

  const allSeatsFilled = match ? getFilledSeatCount(match) === match.players.length : false;
  const hasStarted = match ? hasHostStarted(match) : false;
  const isAbandoned = match ? match.players.every((player) => !player.name) : false;
  const isHost = credentials?.playerID === '0';
  const shouldShowBoard = Boolean(match) && allSeatsFilled && hasStarted;
  const isMutating = isStarting || isLeaving || isRefreshing;

  usePolling(pollMatch, 3_000, !shouldShowBoard);

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
    try {
      await navigator.clipboard.writeText(window.location.href);
      showSnackbar('Copied!', 'success');
    } catch {
      showSnackbar('Unable to copy the invite URL.', 'error');
    }
  };

  if (!credentialsReady || isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="text.secondary">Loading room…</Typography>
      </Container>
    );
  }

  if (errorMessage) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <Alert severity="error">{errorMessage}</Alert>
          <Button component={Link} href="/lobby" variant="contained">
            Back to Lobby
          </Button>
        </Stack>
      </Container>
    );
  }

  if (match && shouldShowBoard) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Room {matchID}
              </Typography>
              <Typography color="text.secondary">
                {credentials
                  ? `Connected as seat ${credentials.playerID}.`
                  : 'Observer mode: this browser has no saved credentials for the room.'}
              </Typography>
            </Box>
            <Button component={Link} href="/lobby" variant="outlined">
              Back to Lobby
            </Button>
          </Box>

          {!credentials && (
            <Alert severity="info">
              You are viewing the room without a claimed seat. The board is running in observer mode.
            </Alert>
          )}

          <Card variant="outlined">
            <CardContent>
              <Boardgame
                isLocal={false}
                matchID={matchID}
                playerID={credentials?.playerID}
                credentials={credentials?.credential}
                numPlayers={match.players.length}
              />
            </CardContent>
          </Card>
        </Stack>
      </Container>
    );
  }

  if (match && isAbandoned && !hasStarted) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <Alert severity="info">This room was abandoned.</Alert>
          <Button component={Link} href="/lobby" variant="contained">
            Return to Lobby
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Waiting Room
            </Typography>
            <Typography color="text.secondary">
              Room ID: <Box component="span" sx={{ fontFamily: 'monospace' }}>{matchID}</Box>
            </Typography>
          </Box>
          <Button component={Link} href="/lobby" variant="outlined">
            Back to Lobby
          </Button>
        </Box>

        {credentials ? (
          <Alert severity="success">
            Seat {credentials.playerID} is reserved in this browser. Waiting for everyone to join.
          </Alert>
        ) : (
          <Alert severity="info">
            This browser has no saved seat for the room. Join from the lobby if you want to claim one.
          </Alert>
        )}

        {allSeatsFilled && !hasStarted && (
          <Alert severity={isHost ? 'info' : 'warning'}>
            {isHost
              ? 'All seats are filled. Use Start Game to move everyone into the board.'
              : 'All seats are filled. Waiting for the host to start the game.'}
          </Alert>
        )}

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" component="h2">
                Players
              </Typography>
              <Typography color="text.secondary">
                {match ? `${getFilledSeatCount(match)} / ${match.players.length} seats filled` : 'Loading seats…'}
              </Typography>
              <Divider />
              <List disablePadding>
                {match?.players.map((player) => (
                  <ListItem key={player.id} disableGutters>
                    <ListItemText
                      primary={`Seat ${player.id}`}
                      secondary={hasPlayerName(player) ? player.name : 'Open seat'}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" component="h2">
                Invite Link
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  value={inviteURL}
                  InputProps={{ readOnly: true }}
                  inputProps={{ 'aria-label': 'Invite URL' }}
                  fullWidth
                />
                <IconButton aria-label="Copy invite URL" onClick={() => void handleCopyInviteURL()}>
                  <ContentCopyIcon />
                </IconButton>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Button onClick={() => void handleRefreshNow()} variant="text" disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing…' : 'Refresh Now'}
          </Button>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {isHost && credentials && (
              <Button
                onClick={handleStartGame}
                variant="contained"
                disabled={!allSeatsFilled || isMutating}
              >
                {isStarting ? 'Starting…' : 'Start Game'}
              </Button>
            )}
            <Button onClick={handleLeaveMatch} color="error" variant="outlined" disabled={isMutating}>
              {isLeaving ? 'Leaving…' : credentials ? 'Leave Match' : 'Back to Lobby'}
            </Button>
          </Box>
        </Box>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={closeSnackbar}
      >
        <Alert severity={snackbar.severity} onClose={closeSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
