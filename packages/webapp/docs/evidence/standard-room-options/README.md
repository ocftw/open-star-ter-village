# Standard room options — 2026-10-28

Implementation build: 3ed34aee. This supersedes the earlier two-option room creation flow. Historical A/B/C/D balance results remain tied to their original builds.

## Exercised evidence

| Requirement | Observed result | Evidence |
| --- | --- | --- |
| Per-project unfinished VP | Separate 1+1 → 0, 3+1 → 1, 3+3 → 2; same-project cubes combine; final event selects winner after scoring | game.test.ts |
| Validated room settings | Unknown/retired options rejected; authoritative defaults persisted in metadata; refresh/export/rematch retain settings | options.test.ts, standard.spec.ts |
| Actual rotation and extra rounds | 108 settings/player-count games plus 108 exact replays; every round has each seat once; configured total rounds; zero failures | [matrix.json](matrix.json) |
| Four tree presets | Every layer immediately below/at threshold; difficulty 3 adds one completion and 3 public CC; no double counting | standard.test.ts and matrix |
| Public history | Every player's final score reconciles with history; shared history across two independent browser contexts, reconnect and JSON persistence; private discard IDs redacted | history.test.ts, standard.spec.ts, [desktop](history-desktop.png), [mobile](history-mobile.png) |
| Minimal room UI | Select rotation/extra rounds/tree/rewards, create, wait, start, refresh and export at 1440px and 390px | [desktop form](experiments-lobby.png), [mobile form](experiments-lobby-mobile.png), [waiting room](experiments-waiting.png), [board](experiments-board.png) |

Local build, 517 Jest tests, TypeScript and lint passed. Seven production-build browser/network scenarios passed. Browser runs use one external development machine; they do not establish three-network/cellular latency.

## Opening-event investigation

All 13 ordinary cards were forced first in 2/3/4-player authoritative games (39 cases). After the report specified 4 players, Government 5 new cubes, and difficulty rewards, all 13 were rerun with that configuration. All 52 games finished without rejected moves or step-cap failures. This does **not** claim the reported bug is fixed. The affected card/export/build is still unidentified; requested the card from the user and provided the [implemented catalog](../../poc-event-cards.json). No event was suppressed or removed. The repository's physical-English inventory is game-content/event-cards.md; the revised Digital Minister intentionally differs.

## Limits

The matrix is functional smoke coverage, not a new balance study. New rooms reject existing-only Government 5; older serialized state and explicitly opted-in offline historical simulations retain it. Deployment restarts lose in-memory matches. No production restart or alert injection is part of smoke testing.

## Deployed smoke result

Deployed build: 3ed34aee7b763c81f9284a32da5f4ac477990e4d. POC: https://open-star-ter-village-tree-poc.fly.dev/lobby. Fly machine 2869242f549078, one always-on Singapore machine. Previous rollback image: registry.fly.io/open-star-ter-village-tree-poc:deployment-01M5ZW40RFN8MXPNY5VP2FGB04.

All four [public probes](public-probes.json) returned 200. All seven deployed browser/Socket.IO scenarios passed in 41.6 seconds, including complete 2/3/4-player games, WebSocket synchronization, reconnect, metadata defaults, retired-option rejection, rematch settings, shared history, mobile rendering and export. [Actual deployed export](deployed-export.json) confirms build/settings. [Deployed lobby](deployed-experiments-lobby.png), [mobile lobby](deployed-experiments-lobby-mobile.png), [desktop history](deployed-history-desktop.png), [mobile history](deployed-history-mobile.png).

Tests ran from one host outside Fly. No claim of cellular coverage, three distinct networks or measured move RTT below 300 ms. No additional restart or UptimeRobot/Discord alert test was performed.
