/**
 * DB-C5 / DB-C5-H / DB-P6 move inventory: which OSV moves can a client
 * predict from its playerView state? Evidence for
 * docs/evidence/issue-445/move-inventory.md.
 *
 * boardgame.io's client reducer runs only a move's body; turn/phase triggers
 * (turn.onEnd refill and settle, the next turn's event draw) run on the
 * server and arrive with its broadcast. So a move is public-only when its
 * body and validator read nothing playerView hides (decks, other hands,
 * server randomness).
 */
import type { Ctx, State } from 'boardgame.io';
import { CreateGameReducer, InitializeGame } from 'boardgame.io/internal';
import { OpenStarTerVillage } from './game';
import { action } from './core/stage/action/action';
import { playerView } from './core/playerView';
import { refill } from './core/handler/refill';
import { playEventCard } from './core/handler/playEventCard';
import { ProjectBoardMutator, ProjectBoardSelector } from './store/slice/projectBoard';
import { ProjectSlotMutator } from './store/slice/projectSlot/projectSlot';
import { PlayersMutator } from './store/slice/players';
import type { GameState } from './store/store';

export const MOVE_INVENTORY: Record<string, { kind: 'public' | 'hidden'; reads: string }> = {
  createProject: { kind: 'hidden', reads: 'draws job cards from G.decks.jobs to refill the job slots' },
  recruit: { kind: 'hidden', reads: 'discards to and draws from G.decks.jobs' },
  removeAndRefillJobs: { kind: 'hidden', reads: 'discards to and draws from G.decks.jobs' },
  discardExcessJobCards: { kind: 'hidden', reads: 'discards to G.decks.jobs' },
  endActionTurn: { kind: 'hidden', reads: 'its result is the server-side turn end: refill from G.decks.projects, settle, event draw' },
  contributeOwnedProjects: { kind: 'public', reads: "own player state, project board, rules" },
  contributeJoinedProjects: { kind: 'public', reads: "own player state, project board, rules" },
};

const moves = action.moves as Record<string, { client?: boolean; move: unknown }>;
const makeMove = (type: string, args: unknown[], playerID = '0') =>
  ({ type: 'MAKE_MOVE', payload: { type, args, playerID } }) as never;
const view = (state: State, playerID: string) =>
  ({ ...state, G: playerView({ G: state.G as GameState, ctx: state.ctx, playerID }) }) as State;

/** A 2-player start with a project (owned by `owner`) where player 0 has one worker. */
function stateWithOwnedProject(owner = '0') {
  // InitializeGame returns a frozen state; edit a copy.
  const state = JSON.parse(JSON.stringify(InitializeGame({ game: OpenStarTerVillage, numPlayers: 2 }))) as State<GameState>;
  const G = state.G;
  const card = G.players[owner].hand.projects[0];
  PlayersMutator.useProject(G.players, owner, card);
  ProjectBoardMutator.add(G.table.projectBoard, card);
  const slot = ProjectBoardSelector.getSlotByCard(G.table.projectBoard, card);
  ProjectSlotMutator.assignOwner(slot, owner, 1);
  const jobName = Object.keys(card.requirements)[0];
  ProjectSlotMutator.assignWorker(slot, jobName, '0', 1);
  return { state, slotId: slot.id, jobName };
}

describe('OSV move inventory (DB-C5, DB-P6)', () => {
  it('covers exactly the moves the game defines', () => {
    expect(Object.keys(MOVE_INVENTORY).sort()).toEqual(Object.keys(moves).sort());
  });

  it('marks hidden-info moves client: false and lets public-only moves predict', () => {
    for (const [name, { kind }] of Object.entries(MOVE_INVENTORY)) {
      expect({ name, client: moves[name].client }).toEqual({ name, client: kind === 'hidden' ? false : undefined });
    }
  });

  it('hides decks and other hands from the client state', () => {
    const state = InitializeGame({ game: OpenStarTerVillage, numPlayers: 2 });
    const clientG = view(state, '0').G as Partial<GameState> & { players: Record<string, { hand?: unknown }> };
    expect(clientG.decks).toBeUndefined();
    expect(clientG.players['1'].hand).toBeUndefined();
    expect(clientG.players['0'].hand).toBeDefined();
  });

  it('turn-end hooks read hidden decks, so the turn end can only run on the server', () => {
    const state = InitializeGame({ game: OpenStarTerVillage, numPlayers: 2 });
    const context = { G: view(state, '0').G as GameState, ctx: state.ctx as Ctx } as Parameters<typeof refill>[0];
    expect(() => refill(context)).toThrow(TypeError);
    expect(() => playEventCard(context)).toThrow(TypeError);
  });

  it.each([
    ['contributeOwnedProjects', '0'],
    ['contributeJoinedProjects', '1'],
  ])('%s predicted on the client equals the server result at the player view', (name, owner) => {
    const { state, slotId, jobName } = stateWithOwnedProject(owner);
    const action = makeMove(name, [[{ projectSlotId: slotId, jobName, value: 1 }]]);
    const server = CreateGameReducer({ game: OpenStarTerVillage })(state, action);
    const predicted = CreateGameReducer({ game: OpenStarTerVillage, isClient: true })(view(state, '0'), action);
    expect(predicted._stateID).toBe(state._stateID + 1);
    expect(predicted.G).toEqual(view(server, '0').G);
    // The prediction exposes nothing beyond the player's own view.
    expect((predicted.G as Partial<GameState>).decks).toBeUndefined();
    expect((predicted.G as GameState).players['1']).not.toHaveProperty('hand');
  });

  it('a rejected public move leaves the client prediction unchanged, matching the server', () => {
    const { state, jobName } = stateWithOwnedProject();
    const action = makeMove('contributeOwnedProjects', [[{ projectSlotId: 'no-such-slot', jobName, value: 1 }]]);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const server = CreateGameReducer({ game: OpenStarTerVillage })(state, action);
    const predicted = CreateGameReducer({ game: OpenStarTerVillage, isClient: true })(view(state, '0'), action);
    expect(predicted.G).toEqual(view(server, '0').G);
    expect(server._stateID).toBe(state._stateID);
    jest.restoreAllMocks();
  });
});

describe('client: false never runs a hidden-info move locally (DB-C5-H)', () => {
  const hidden = Object.entries(MOVE_INVENTORY).filter(([, { kind }]) => kind === 'hidden').map(([name]) => name);

  it.each(hidden)('%s returns the client state untouched; the server fills the result', (name) => {
    const state = InitializeGame({ game: OpenStarTerVillage, numPlayers: 2 });
    const clientState = view(state, '0');
    const predicted = CreateGameReducer({ game: OpenStarTerVillage, isClient: true })(clientState, makeMove(name, []));
    expect(predicted.G).toBe(clientState.G);
    expect(predicted.ctx).toBe(clientState.ctx);
    expect(predicted._stateID).toBe(clientState._stateID);
  });
});
