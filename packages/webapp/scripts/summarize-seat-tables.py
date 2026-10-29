#!/usr/bin/env python3
"""Seat-assignment summary for a sweep run that mixes bot profiles.

For each player count and seat assignment (seat 1 first; N = Novice,
M = Normal, A = Advance): games, win share per seat (ties split the win),
mean score per seat and tree nodes grown per game. For tables that mix
profiles: each profile's win share per seat, and by how many of it sit at
the table. Writes summary.json into the run folder.

    python3 scripts/summarize-seat-tables.py bot-runs/novice-normal
"""
import gzip
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

# Older runs used B = Balanced, C = Counter and S = Strategist for today's Novice, Advance and Normal.
LEGACY_SEATS = str.maketrans('BCS', 'NAM')
NAMES = {'N': 'Novice', 'M': 'Normal', 'A': 'Advance'}


def main():
    run = Path(sys.argv[1])
    tables = defaultdict(lambda: {'games': 0, 'win': None, 'score': None, 'grown': 0})
    failures = 0
    for path in sorted(run.glob('b*/s*.jsonl.gz')):
        with gzip.open(path, 'rt') as lines:
            for line in lines:
                game = json.loads(line)
                if 'err' in game:
                    failures += 1
                    continue
                n, combo = game['n'], game['c'].translate(LEGACY_SEATS)
                t = tables[combo]
                if t['win'] is None:
                    t['win'], t['score'] = [0.0] * n, [0.0] * n
                t['games'] += 1
                t['grown'] += len(game['g'])
                for seat in game['w']:
                    t['win'][seat] += 1 / len(game['w'])
                for seat, score in enumerate(game['sc']):
                    t['score'][seat] += score

    out = {'run': run.name, 'failures': failures, 'playerCounts': {}}
    for n in sorted({len(c) for c in tables}):
        combos = {c: t for c, t in tables.items() if len(c) == n}
        rows = [{'table': c, 'games': t['games'], 'seatWin': [w / t['games'] for w in t['win']],
                 'seatScore': [s / t['games'] for s in t['score']], 'grown': t['grown'] / t['games']}
                for c, t in sorted(combos.items(), key=lambda kv: (sorted(set(kv[0])), kv[0]))]
        by_seat = defaultdict(lambda: [0.0, 0])
        by_count = defaultdict(lambda: [0.0, 0])
        for c, t in combos.items():
            if len(set(c)) < 2:
                continue
            for seat, k in enumerate(c):
                by_seat[(k, seat)][0] += t['win'][seat]
                by_seat[(k, seat)][1] += t['games']
            for k in set(c):
                by_count[(k, c.count(k))][0] += sum(t['win'][s] for s, x in enumerate(c) if x == k)
                by_count[(k, c.count(k))][1] += t['games'] * c.count(k)
        mixed = {}
        for k in sorted({k for k, _ in by_seat}):
            seats = []
            for seat in range(n):
                w, g = by_seat[(k, seat)]
                p = w / g
                seats.append({'seat': seat + 1, 'win': p, 'se': math.sqrt(p * (1 - p) / g), 'seatGames': g})
            counts = [{'count': c, 'winPerSeat': w / g} for (kk, c), (w, g) in sorted(by_count.items()) if kk == k]
            mixed[NAMES[k]] = {'bySeat': seats, 'byCount': counts}
        out['playerCounts'][n] = {'fairShare': 1 / n, 'tables': rows, 'mixedTables': mixed}

        print(f'\n{n} players (fair share {100 / n:.1f}%)')
        print('| Table | Games | Win % by seat | Score by seat | Nodes grown |\n| --- | --- | --- | --- | --- |')
        for r in rows:
            print(f"| {r['table']} | {r['games']} | {' / '.join(f'{100 * w:.1f}' for w in r['seatWin'])} | "
                  f"{' / '.join(f'{s:.1f}' for s in r['seatScore'])} | {r['grown']:.1f} |")
        for name, m in mixed.items():
            print(f"{name} in mixed tables, by seat: " + ' / '.join(f"{100 * s['win']:.1f} ±{200 * s['se']:.1f}" for s in m['bySeat'])
                  + '; by count at table: ' + ', '.join(f"{c['count']}: {100 * c['winPerSeat']:.1f}" for c in m['byCount']))
    (run / 'summary.json').write_text(json.dumps(out, indent=1) + '\n')


if __name__ == '__main__':
    main()
