# 新手型 Novice

Profile `NOVICE` in
[`src/game/bots/profiles.ts`](../../../../src/game/bots/profiles.ts); strategy
id `novice`, seat names 小新, 菜菜, 嫩嫩, 初初, 萌萌, 阿學. Before the rename it
was Balanced (平衡型, id `balanced`).

Novice scores every legal move by its expected points and also values tree
abilities that help other players. It is the reference profile for batch
runs. Its known weakness: earlier seats set up projects that later seats
finish, so in all-Novice games the last seat wins most often. Treat seat
results from all-Novice runs as a property of this bot, not of the rules.

## Runs

| Run | What it shows |
| --- | --- |
| [baseline-100](baseline-100/README.md) | First batch runner check: 100 games per player count, completion and tree reach, debug panel |

Rule experiments that used Novice in every seat:
[balance-300](../../standard-experiments/balance-300/README.md) and
[seed-batches-1-100](../../standard-experiments/seed-batches-1-100/).
