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
| [advance/vs-novice](../advance/vs-novice/README.md) | Every Novice/Advance seat assignment on the default room options, including the all-Novice tables |
| [normal/vs-novice](../normal/vs-novice/README.md) | Every Novice/Normal seat assignment on the default room options, including the all-Novice tables |

Earlier all-Novice runs (`baseline-100`, the `balance-300` rule experiment and
`seed-batches-1-100`) were recorded on builds whose rules have since changed
and were removed; they stay in git history, e.g.
[baseline-100 at c75742d9](https://github.com/ocftw/open-star-ter-village/blob/c75742d9/packages/webapp/docs/evidence/bots/novice/baseline-100/README.md).
