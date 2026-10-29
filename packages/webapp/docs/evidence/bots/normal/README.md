# 一般型 Normal

Profile `NORMAL` in
[`src/game/bots/profiles.ts`](../../../../src/game/bots/profiles.ts); strategy
id `normal`, seat names 阿明, 小華, 中中, 平平, 阿正, 小安. Before the rename it
was Strategist; the runs below were recorded under that name, with seat
letter `S` in the per-game records and manifests. Today's analysis scripts
read `S` as Normal (`M`).

Normal is Advance with the shared tree weighted at 1 instead of 0.6 and a
pace planner (see [the bot guide](../../../bot-players.md#normal)). From the
rules in play and the rounds left, it judges whether a project can still be
finished, which project pile is worth drawing, and how much a tree ability
speeds up its own projects.

What the runs show:

- With Normal in every seat the tree grows in every game, scores rise, and
  the last seat wins most, as with Novice.
- Normal beats Novice from every seat, but loses to Advance from every seat.
  Normal values a tree ability only by its own gain while every player gets
  it, so it grows most of the shared tree and Advance benefits without
  paying the AP.
- Normal still almost never plays 3★ or 4★ projects: players pass 20 points,
  which unlocks the advanced pile, too late to finish one alone.

## Runs

| Run | What it shows |
| --- | --- |
| [sweep72](sweep72/README.md) | 648,000 games, Normal in every seat, across all 72 room-option scenarios: seat balance, star tree, projects by stars |
| [vs-advance](vs-advance/README.md) | 36,000 games on the default room options: Normal in each seat in turn, Advance in the others |
| [vs-novice](vs-novice/README.md) | 112,000 games on the default room options: every seat assignment of Novice and Normal |
