# Bot evidence

Evidence is grouped by bot profile, so a new profile gets its own folder
without moving anything that already exists.

```text
bots/
├── seats/                 Host-managed bot seats in a real room (any profile)
├── novice/                新手型 Novice, profile NOVICE
│   └── baseline-100/      Milestone 1: 100 games per player count, Novice in every seat
├── normal/                一般型 Normal, profile NORMAL (recorded as Strategist)
│   ├── sweep72/           648,000 games, Normal in every seat, all 72 room-option scenarios
│   ├── vs-advance/        36,000 games: Normal in each seat, Advance in the others
│   └── vs-novice/         112,000 games: every seat assignment of Novice and Normal
└── advance/               進階型 Advance, profile ADVANCE
    ├── vs-novice-1000/    36,000 paired games: Advance in seat 1 or 2, Novice elsewhere
    └── sweep72/           648,000 games, Advance in every seat, all 72 room-option scenarios
```

Each profile folder has a README that describes the profile and lists its
runs. Profiles are defined in
[`src/game/bots/profiles.ts`](../../../src/game/bots/profiles.ts) and offered
in rooms through [`src/game/bots/strategies.ts`](../../../src/game/bots/strategies.ts).

How to size, run and check a sweep: [bot testing](../../bot-testing.md).

## Adding a run or a profile

- Put each run in `bots/<profile id>/<run>/`, using the profile's id from
  `PROFILES`. For a run that compares two profiles, use the challenger's
  folder and name the run after the opponent and size, e.g. `vs-novice-1000`.
- Each run folder holds a `README.md` (date, build, exact command, results and
  limits) next to the manifest and data the command wrote.
- Add the run to the profile's README. A new profile also gets a line in the
  tree above.

Runs whose subject is a rule change rather than a bot, such as
[`standard-experiments/balance-300`](../standard-experiments/balance-300/README.md),
stay with the rule evidence and are linked from the profile they used.
