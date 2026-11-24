# OSV move inventory: public-only vs hidden-info (#445, DB-P6 / DB-C5 / DB-C5-H)

The approved rule: a move that reads only public state is predicted on the
client right after the action is sent; a move that depends on state that
`playerView` hides keeps `client: false`, shows an immediate pending visual,
and the server broadcast fills in the result.

## What the client can see

`src/game/core/playerView.ts` removes `G.decks` (project, job and event decks,
including their draw order) for everyone, and removes `hand` from every player
except the viewer. Observers see no hands.

**Caveat (pre-existing, tracked separately):** `playerView` filters the state
that move updates broadcast, but boardgame.io 0.50.2 also sends the match's
`initialState` unfiltered when a client syncs. That copy includes the starting
hands, deck order and PRNG state, so hidden information does **not** fully stay
server-side today. This inventory only decides which moves the client can
predict; it does not close that leak, which predates #445.

## How prediction works in boardgame.io 0.50.2

The client reducer (`CreateGameReducer({ isClient: true })`) runs **only the
move body**. Turn and phase triggers (this game's `turn.onEnd`: `settleProjects`,
`scoreLeftoverActionTokens`, `refill`; the next turn's `playEventCard`; the
round phase's `endIf`) run only on the server. Event calls (`events.endTurn`)
are never materialized on the client either. So a move is public-only when its
validator and body read nothing hidden; whatever the turn end does arrives with
the authoritative broadcast.

## Inventory

| Move | Reads / writes | Hidden dependency | Class | `client` |
| --- | --- | --- | --- | --- |
| `createProject` | own hand, job slots, project board, rules; refills job slots | draws from `G.decks.jobs`, discards to it | hidden | `false` |
| `recruit` | job slots, project board, rules; refills job slots | discards to and draws from `G.decks.jobs` | hidden | `false` |
| `removeAndRefillJobs` | job slots, rules, score board | discards to and draws from `G.decks.jobs` | hidden | `false` |
| `discardExcessJobCards` (四大自由) | job slots | discards to `G.decks.jobs` | hidden | `false` |
| `endActionTurn` | `events.endTurn()` or `G.table.actionPhaseDone` | its visible result is the server-side turn end: `refill` draws from `G.decks.projects`, settlement, next event draw from `G.decks.events` | hidden | `false` |
| `contributeOwnedProjects` | own player (action tokens), project board, rules | none (validator accepts `ClientGameState`) | **public** | predicted |
| `contributeJoinedProjects` | own player (action tokens), project board, rules | none (validator accepts `ClientGameState`) | **public** | predicted |

If a contribution spends the last action point, the turn ends on the server;
the client shows its predicted contribution immediately and the broadcast then
brings the turn end (refill, settlement, next player).

## Evidence (tests)

- `src/game/moveInventory.test.ts`
  - the inventory covers exactly the action-stage moves, and hidden moves are
    `client: false` while public ones are not;
  - the client state has no decks and no other hands;
  - `refill` and `playEventCard` throw on a `playerView` state (the turn end
    cannot run on the client);
  - both contribute moves, predicted on the client state, equal the server
    result filtered to that player (`_stateID` advanced, no decks or other
    hands exposed); a rejected contribution leaves both unchanged;
  - every hidden move leaves the client state untouched (`client: false`).
- `src/server/gameServer.test.ts`
  - real Socket.IO clients: a public move is predicted before a delayed
    server write finishes, then equals the server state; a hard `_stateID`
    reject reconciles the predicting client and is never published;
  - `endActionTurn` over sockets: nothing changes locally until the broadcast,
    then each seat equals the server state through `playerView`, with no other
    hand and no decks.
- `src/components/board/useMovePending.test.tsx`: dispatching a hidden move
  shows the pending visual at once; the next server state clears it; public
  moves show none.
