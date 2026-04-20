'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
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

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
};

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
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [snackbar, setSnackbar] = React.useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = React.useCallback((message: string, severity: SnackbarState['severity']) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadMatchMetadata = React.useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const nextMatch = await getMatch(matchID);
      setMatch(nextMatch);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getLobbyErrorMessage(error, 'Unable to load this room.'));
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [matchID]);

  React.useEffect(() => {
    setCredentials(loadCredentials(matchID));
    setCredentialsReady(true);
  }, [matchID]);

  React.useEffect(() => {
    setInviteURL(window.location.href);
  }, []);

  React.useEffect(() => {
    void loadMatchMetadata();

    const intervalID = window.setInterval(() => {
      void loadMatchMetadata(true);
    }, 3_000);

    return () => {
      window.clearInterval(intervalID);
    };
  }, [loadMatchMetadata]);

  const allSeatsFilled = match ? getFilledSeatCount(match) === match.players.length : false;
  const hasStarted = match ? hasHostStarted(match) : false;
  const isHost = credentials?.playerID === '0';
  const shouldShowBoard = Boolean(match) && allSeatsFilled && hasStarted;

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
      await loadMatchMetadata(true);
    } catch (error) {
      showSnackbar(getLobbyErrorMessage(error, 'Unable to start the game.'), 'error');
    } finally {
      setIsStarting(false);
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
              <TextField value={inviteURL} InputProps={{ readOnly: true }} fullWidth />
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Button onClick={() => void loadMatchMetadata()} variant="text">
            Refresh Now
          </Button>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {isHost && credentials && (
              <Button
                onClick={handleStartGame}
                variant="contained"
                disabled={!allSeatsFilled || isStarting}
              >
                {isStarting ? 'Starting…' : 'Start Game'}
              </Button>
            )}
            <Button onClick={handleLeaveMatch} color="error" variant="outlined" disabled={isLeaving}>
              {isLeaving ? 'Leaving…' : credentials ? 'Leave Match' : 'Back to Lobby'}
            </Button>
          </Box>
        </Box>
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
