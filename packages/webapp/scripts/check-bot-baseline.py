"""Compare a sweep run with recorded evidence for the same scenarios and seeds.

Bot games are deterministic per seed, so a run that replays recorded seeds
must reproduce the recorded numbers exactly. Any difference means the rules or
a bot changed behaviour; see docs/bot-testing.md for what to do next.

    python3 scripts/check-bot-baseline.py bot-runs/behaviour docs/evidence/bots/advance/sweep72/analysis.json
"""
import argparse
import json
import sys
from pathlib import Path

FIELDS = ['games', 'failures', 'seatWin', 'meanScore', 'topScore', 'tieRate', 'rounds', 'moves',
          'grown', 'nodeRate', 'played', 'completed', 'advancedDraws', 'breakdown']


def close(a, b):
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(close(a[k], b[k]) for k in a)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(close(x, y) for x, y in zip(a, b))
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(a - b) <= 1e-9
    return a == b


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('run', type=Path)
    parser.add_argument('baseline', type=Path)
    args = parser.parse_args()
    run = json.loads((args.run / 'analysis.json').read_text())
    base = json.loads(args.baseline.read_text())
    for key in ('seedPrefix', 'runsPerBatch', 'tables'):
        if run['manifest'][key] != base['manifest'][key]:
            sys.exit(f'run {key}={run["manifest"][key]!r} does not replay the baseline ({base["manifest"][key]!r})')
    if run['batchesUsed'] != base['batchesUsed']:
        sys.exit(f'run used batches {run["batchesUsed"]}, baseline {base["batchesUsed"]}: replay the same batches')
    recorded = {(s['index'], s['n']): s for s in base['scenarios']}
    diffs = []
    for s in run['scenarios']:
        b = recorded.get((s['index'], s['n']))
        if b is None:
            sys.exit(f'baseline has no scenario {s["id"]} at {s["n"]} players')
        diffs += [f'{s["id"]} {s["n"]}p {f}: run {s[f]} baseline {b[f]}' for f in FIELDS if not close(s[f], b[f])]
    for d in diffs:
        print(d)
    checked = len(run['scenarios'])
    if diffs:
        sys.exit(f'{len(diffs)} differences across {checked} scenario × player-count cells')
    print(f'{checked} scenario × player-count cells match the baseline exactly')


if __name__ == '__main__':
    main()
