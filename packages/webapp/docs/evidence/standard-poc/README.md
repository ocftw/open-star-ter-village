# Standard POC observed evidence

Public run: 2026-10-26, Chromium, one external network, production Fly app `open-star-ter-village-tree-poc`. Runtime commit `56860bbb`. Normal DNS; no resolver override on this run.

Run the public command in ../../standard-tree-poc.md. All five scenarios passed in 30.2 seconds (public-tests.txt):

- Lobby: select Standard; 2/3/4 seats offered, 5 absent. POST /games/OpenStarTerVillage/create with Standard/5, unknown/3 and simple/2 each returned 400.
- Authenticated Socket.IO clients using WebSocket-only transport completed 2-, 3- and 4-player games. After each move, all boards and state IDs synchronized. Other-player hands and decks were absent. A client stopped and restarted successfully.
- Browser player grew Source 1, refreshed, and retained the grown node and 2 remaining AP. Screenshots show the real board at 1440×1000 and 390×844 viewports. Standard is new behavior with no comparable prior tree-panel state.

Screenshots: [desktop](standard-desktop.png), [mobile](standard-mobile.png).

The game automation skips optional settlement bonuses; it does not establish that every ability was exercised in a public multiplayer match. Ability edge cases have local automated coverage; human clarity/balance evidence remains pending. No phone/cellular, three-network, latency benchmark or notification test was performed. This is a draft POC review, not completed human acceptance.
