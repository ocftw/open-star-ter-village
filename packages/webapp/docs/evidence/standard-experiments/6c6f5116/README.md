# Rebased POC deployment — 2026-10-28 (Asia/Ho_Chi_Minh)

Runtime: `6c6f5116dbf61a10af3ec4d611028074c159199f`, rebased onto
`origin/main` at `e91d3e31e74955c2b18d37012f69dc213da154f6`.

The first force-with-lease push rejected a concurrent main-merge commit
`836fd30a`. Its conflict resolutions were inspected and preserved. The final
rebased tree exactly matches that remote merge's files; it changes the history
to base the POC commits on main. The premature image build was canceled before
replacing the running machine. The subsequent leased push and deployment succeeded.

- App: https://open-star-ter-village-tree-poc.fly.dev/lobby
- Server: https://open-star-ter-village-tree-poc.fly.dev:3001
- Image: `deployment-01M5ZW40RFN8MXPNY5VP2FGB04`
- Machine: `2869242f549078`, Singapore, started, both health checks passing.
- Public `/`, `/lobby`, `:3001/health`, `:3001/games/OpenStarTerVillage`: HTTP 200.

## Exercised public workflow

[Six public Playwright scenarios](public-tests.txt) passed in 31.1 seconds from
one external developer network using Chromium. These cover complete 2/3/4-player
WebSocket games, hidden information, reconnect, rematch settings, tree growth,
refresh, creation of an experimental room through the UI, waiting room, board
and downloaded summary. Invalid options and experiments on Simplified return 400.

The [downloaded summary](experiments-export.json) reports the exact runtime SHA
above and `government5: any`, `completionRewards: difficulty`. This verifies
that both options are deployed, not merely present in local code.

- [Creation desktop, 1440×1000](experiments-lobby.png)
- [Creation mobile viewport, 390×844](experiments-lobby-mobile.png)
- [Waiting room](experiments-waiting.png)
- [Board after refresh](experiments-board.png)

Local integration also passed nine scenarios, combining the six Standard tests
with main's live-lobby lifecycle, post-game leave/result preservation and rematch
invitation tests. Build, 299 Jest tests and TypeScript passed after integration.

Limits: optional bonus choices are generally skipped in the transport games;
mechanic-specific evidence remains in the parent directory's deterministic rule
scenarios and tests. No physical mobile device, multiple external networks,
latency SLA or UptimeRobot/Discord notification test was performed. Deploying
restarted the in-memory server and cleared prior rooms. No production app was
changed.
