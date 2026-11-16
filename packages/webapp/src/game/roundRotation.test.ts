import { Client } from 'boardgame.io/client';
import type { Game } from 'boardgame.io';
import { OpenStarTerVillage } from './game';
import { setup, GameSetupData } from './core/setup';
import { GameState } from './store/store';
import type { EventCard } from './card';
import rawEventCards from './data/card/events.json';

type TestClient = ReturnType<typeof Client<GameState>>;

const FOUR_FREEDOMS = 'add_two_worker_slots';

// Real game plus a test-only move that spends every remaining AP, so a turn can
// end through the engine's out-of-AP path rather than End Turn. playerView is
// dropped so tests can read the decks. 四大自由 (which correctly holds the round
// open until the last player discards) is pinned to round 1 or neutralized,
// keeping the deck size and so the number of rounds unchanged.
const testTurn: Game<GameState>['turn'] = {
  ...OpenStarTerVillage.turn,
  stages: {
    action: {
      moves: {
        ...OpenStarTerVillage.turn!.stages!.action.moves,
        spendAllActionPoints: ({ G, playerID }) => {
          G.players[playerID].token.actions = 0;
        },
      },
    },
  },
};

type StartOpts = { fourFreedomsFirst?: boolean; setupData?: GameSetupData };

const makeGame = (opts: StartOpts = {}): Game<GameState> => ({
  ...OpenStarTerVillage,
  playerView: undefined,
  // This boardgame.io Client has no setupData option; close over it like DevGameHost.
  setup: (context) => {
    const G = setup(context, opts.setupData);
    const pile = G.decks.events.drawPile;
    const idx = pile.findIndex((card) => card.function_name === FOUR_FREEDOMS);
    if (opts.fourFreedomsFirst) {
      if (idx < 0) pile.unshift(rawEventCards.find((card) => card.function_name === FOUR_FREEDOMS) as EventCard);
      else pile.unshift(...pile.splice(idx, 1));
    } else if (idx >= 0) {
      pile[idx] = { ...pile[idx], function_name: 'test_no_effect' };
    }
    return G;
  },
  turn: testTurn,
  // boardgame.io writes the top-level turn into the (shared) phase object in
  // place, so this game needs its own round phase carrying its own turn.
  phases: { round: { ...OpenStarTerVillage.phases!.round, turn: testTurn } },
});

const start = (numPlayers: number, opts: StartOpts = {}): TestClient => {
  const client = Client<GameState>({ game: makeGame(opts), numPlayers });
  client.start();
  return client;
};

const ctx = (client: TestClient) => client.getState()!.ctx;

/** Plays one whole round, returning who acted, in order. */
const playRound = (client: TestClient, endBy: (seatIndex: number) => 'endTurn' | 'outOfAP') => {
  const numPlayers = ctx(client).numPlayers;
  const actors: string[] = [];
  for (let seat = 0; seat < numPlayers; seat++) {
    const { currentPlayer } = ctx(client);
    actors.push(currentPlayer);
    client.updatePlayerID(currentPlayer);
    if (endBy(seat) === 'endTurn') client.moves.endActionTurn();
    else (client.moves as Record<string, () => void>).spendAllActionPoints();
  }
  return actors;
};

type Rotation = NonNullable<GameSetupData['starterRotation']>;

/** Seat order for a round: clockwise offset round-1, counterclockwise 1-round, none 0. */
const expectedOrder = (numPlayers: number, round: number, rotation: Rotation = 'clockwise') => {
  const offset = rotation === 'clockwise' ? round - 1 : rotation === 'counterclockwise' ? 1 - round : 0;
  return Array.from({ length: numPlayers }, (_, seat) =>
    String((((offset + seat) % numPlayers) + numPlayers) % numPlayers));
};

const CW = { starterRotation: 'clockwise' } as const;

describe('round starter rotation (real engine)', () => {
  const cases = [2, 3, 4].map((numPlayers) => ({ numPlayers, rounds: numPlayers === 4 ? 4 : 3 }));

  test.each(cases)(
    '$numPlayers players: round r starts with seat (r-1) mod n and goes clockwise',
    ({ numPlayers, rounds }) => {
      const client = start(numPlayers, { setupData: CW });
      expect(ctx(client).phase).toBe('round');
      for (let round = 1; round <= rounds; round++) {
        // Alternate how the round's last turn ends: End Turn on odd rounds,
        // running out of AP on even rounds.
        const lastEndsBy = round % 2 === 1 ? 'endTurn' : 'outOfAP';
        const actors = playRound(client, (seat) =>
          seat === numPlayers - 1 ? lastEndsBy : seat % 2 === 0 ? 'endTurn' : 'outOfAP',
        );
        expect({ round, actors }).toEqual({ round, actors: expectedOrder(numPlayers, round) });
        expect(ctx(client).phase).toBe('round');
        expect({ round, pos: ctx(client).playOrderPos, cp: ctx(client).currentPlayer }).toEqual({ round, pos: 0, cp: expectedOrder(numPlayers, round + 1)[0] });
        expect(ctx(client).gameover).toBeUndefined();
      }
      client.stop();
    },
  );

  test('each round plays exactly one event and the round ends exactly once', () => {
    const client = start(3, { setupData: CW });
    const eventsLeft = () => client.getState()!.G.decks.events.drawPile.length;
    const initial = eventsLeft();
    playRound(client, () => 'endTurn');
    expect(eventsLeft()).toBe(initial - 1); // round 2's event drawn once
    const { G, ctx: c } = client.getState()!;
    expect(G.playOrder).toEqual(['1', '2', '0']);
    expect(c.playOrder).toEqual(['1', '2', '0']);
    expect(c.currentPlayer).toBe('1');
    expect(G.table.actionPhaseDone).toBe(false);
    // Round 1's last player was refilled exactly once (not double-scored/refilled).
    expect(G.players['2'].token.actions).toBe(G.rules.player.maxActionTokens);
    client.stop();
  });

  test('四大自由: the round does not end until the last player resolves the discard', () => {
    const client = start(3, { fourFreedomsFirst: true, setupData: CW });
    const state = () => client.getState()!;
    expect(state().G.table.eventSlot?.function_name).toBe(FOUR_FREEDOMS);
    expect(state().G.table.fourFreedomsPendingDiscards).toHaveLength(2);

    client.updatePlayerID('0');
    client.moves.endActionTurn();
    client.updatePlayerID('1');
    client.moves.endActionTurn();

    // Last player presses End Turn, then also runs out of AP: still their turn.
    client.updatePlayerID('2');
    client.moves.endActionTurn();
    expect(state().ctx.currentPlayer).toBe('2');
    expect(state().ctx.playOrderPos).toBe(2);
    (client.moves as Record<string, () => void>).spendAllActionPoints();
    expect(state().ctx.currentPlayer).toBe('2');
    expect(state().G.table.actionPhaseDone).toBe(true);

    client.moves.discardExcessJobCards(state().G.table.fourFreedomsPendingDiscards);
    expect(state().G.table.fourFreedomsPendingDiscards).toEqual([]);
    expect(state().G.table.actionPhaseDone).toBe(false);
    expect(state().ctx.phase).toBe('round');
    expect(state().ctx.currentPlayer).toBe('1');
    expect(state().ctx.playOrder).toEqual(['1', '2', '0']);
    client.stop();
  });

  test('the last event still ends the game after the rotated rounds', () => {
    const client = start(2, { setupData: CW });
    const eventRounds = client.getState()!.G.decks.events.drawPile.length + 1;
    for (let round = 1; round <= eventRounds; round++) {
      expect(ctx(client).gameover).toBeUndefined();
      const actors = playRound(client, () => 'endTurn');
      expect({ round, actors }).toEqual({ round, actors: expectedOrder(2, round) });
    }
    expect(ctx(client).gameover).toBeDefined();
    client.stop();
  });
});

describe.each<{ label: string; rotation: Rotation; setupData?: GameSetupData }>([
  { label: 'counterclockwise', rotation: 'counterclockwise', setupData: { starterRotation: 'counterclockwise' } },
  { label: 'omitted setupData (none)', rotation: 'none' },
  { label: "explicit 'none'", rotation: 'none', setupData: { starterRotation: 'none' } },
])('starterRotation: $label', ({ rotation, setupData }) => {
  test.each([2, 3, 4].map((numPlayers) => ({ numPlayers, rounds: numPlayers === 4 ? 4 : 3 })))(
    '$numPlayers players: every round follows the configured starter',
    ({ numPlayers, rounds }) => {
      const client = start(numPlayers, { setupData });
      expect(client.getState()!.G.starterRotation).toBe(rotation);
      for (let round = 1; round <= rounds; round++) {
        const actors = playRound(client, (seat) => (seat % 2 === 0 ? 'endTurn' : 'outOfAP'));
        expect({ round, actors }).toEqual({ round, actors: expectedOrder(numPlayers, round, rotation) });
        const next = expectedOrder(numPlayers, round + 1, rotation);
        const { G, ctx: c } = client.getState()!;
        expect(G.playOrder).toEqual(next);
        expect(c.playOrder).toEqual(next);
        expect({ round, pos: c.playOrderPos, cp: c.currentPlayer }).toEqual({ round, pos: 0, cp: next[0] });
        expect(c.gameover).toBeUndefined();
      }
      client.stop();
    },
  );

  test('the last event still ends the game', () => {
    const client = start(2, { setupData });
    const eventRounds = client.getState()!.G.decks.events.drawPile.length + 1;
    for (let round = 1; round <= eventRounds; round++) {
      expect(ctx(client).gameover).toBeUndefined();
      const actors = playRound(client, () => 'endTurn');
      expect({ round, actors }).toEqual({ round, actors: expectedOrder(2, round, rotation) });
    }
    expect(ctx(client).gameover).toBeDefined();
    client.stop();
  });
});

test('starterRotation is normalized: only strict clockwise/counterclockwise rotate', () => {
  for (const bad of [undefined, null, 'CLOCKWISE', true, 1, 'sideways']) {
    const client = start(2, { setupData: { starterRotation: bad } as unknown as GameSetupData });
    expect(client.getState()!.G.starterRotation).toBe('none');
    client.stop();
  }
});
