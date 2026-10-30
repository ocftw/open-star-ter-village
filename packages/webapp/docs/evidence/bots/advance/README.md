# 進階型 Advance

Profile `ADVANCE` in
[`src/game/bots/profiles.ts`](../../../../src/game/bots/profiles.ts); strategy
id `advance`, seat names 老手, 高手, 阿達, 進進, 大師, 精精. Before the rename it
was Counter (反制型, id `counter`).

Advance is Novice with four weights changed: `village` 0, `tree` 0.6,
`unlock` 0 and `initiation` −1. It spends less on the shared tree and uses
the saved actions to complete its own projects before later seats can.

## Runs

| Run | What it shows |
| --- | --- |
| [vs-novice](vs-novice/README.md) | 112,000 games on the default room options: every seat assignment of Novice and Advance |
| [sweep72](sweep72/README.md) | 648,000 games, Advance in every seat, across all 72 room-option scenarios: seat balance, star tree, projects by stars |
