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
| [vs-novice-1000](vs-novice-1000/README.md) | 36,000 paired games: Advance in seat 1 or 2 against Novice, ablations, later seats, room check |
