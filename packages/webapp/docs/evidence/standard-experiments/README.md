# Standard room experiments — 2026-10-27 (Asia/Saigon)

**Deployment update:** both options are now deployed after rebasing onto main.
See [runtime 6c6f5116 and public verification](6c6f5116/README.md).
The records below describe the initial local implementation.

## Deployment performed first

Pulled `origin/feat/standard-tree-poc` by fast-forward from `8ee27f97` to
`f3e359c7` (bot players and host-managed bot seats). Previously unfinished local
experiment edits were stashed before building and restored afterward.

Deployed **only that remote baseline** to:
- Frontend: https://open-star-ter-village-tree-poc.fly.dev/lobby
- Game server: https://open-star-ter-village-tree-poc.fly.dev:3001
- Fly image: `deployment-01M5YX6PYMFERXC62A7FC79H77`
- One Singapore machine `2869242f549078`, both health checks passing.

External probes from this developer machine returned HTTP 200 for `/`, `/lobby`,
`:3001/health` and `:3001/games/OpenStarTerVillage`.
The first multiplayer run overlapped the restart: its 3-player case failed;
after deployment completed, all five public scenarios passed (32.2 seconds):
lobby validation, complete 2/3/4-player WebSocket games with reconnect and hidden
information assertions, and board browser refresh. This is one external network,
not cellular or three independent networks. Latency SLA and notification alerts
were not tested. In-memory rooms are lost on restart.

## Initial experiments verification (before deployment)

Built Next.js and the game server at localhost ports 3140/3141. Six Playwright
scenarios exercised real lobby REST, browser creation and WebSocket clients:

1. Standard offers only 2/3/4 players and rejects invalid counts/rulesets.
2. Complete 2-player game with existing cubes + difficulty rewards.
3. Complete 3-player game with new cubes + fixed rewards.
4. Complete 4-player game with new cubes + difficulty rewards.
5. Default Standard board growth survives browser refresh.
6. Choose both experiments in the real creation form; create a 2-player room;
   verify server metadata and waiting-room text; join a second player, start,
   refresh, and download the public summary. Invalid enum values and experiments
   on Simplified return HTTP 400. Cases 2–4 also create rematches and verify settings.

The gameplay loop in these WebSocket checks skips optional ability choices;
it proves transport and persistence, not every Government 5 target.

### Visual evidence

New creation controls have no comparable before state. The baseline tree panel
is included for comparison. Screenshots use desktop 1440×1000 and mobile 390×844.

- [Baseline board](board-before.png)
- [Creation form, desktop](experiments-lobby.png)
- [Creation form, mobile](experiments-lobby-mobile.png)
- [Waiting room](experiments-waiting.png)
- [Board after refresh](experiments-board.png)
- [Downloaded public summary](experiments-export.json)

### Mechanic evidence

[Rule scenarios and 12 complete seeded bot games](rule-scenarios.json) were
produced by running:

```sh
pnpm webapp exec tsx scripts/verify-standard-experiments.ts
```

The first four records deliberately construct a deterministic four-star target
in an initialized authoritative state. This is a rules fixture, not a human game:
player 1 already contributes 1 of 2 required points; player 0 has one reserve
and a Government 5 allocation. Original mode offers no target and changes no
score. New-cube mode spends 1→0 reserve, completes the project, and returns 0→1;
player 0 earns 3 with fixed rewards or 5 with difficulty rewards. Each assertion
runs before the report is written.

The remaining records are 12 complete, unmodified seeded bot games: all four
rule combinations at 2/3/4 players. These prove finishability for those seeds,
not balance or comprehensive ability coverage. Targeted Jest cases cover repeat
allocation on the same cube, depleted reserves, other-player/invalid/full targets,
duplicate requests, serialized pending choices, partial skip, single scoring and
token refund, all four difficulty rewards, event stacking and bot cost evaluation.

No advanced-project rule or tree-threshold adjustment is included.
