"""Summarize paired challenger-vs-Balanced trials using Python's standard library; split tied wins."""
import argparse
import csv
import gzip
import json
import math
import statistics as st
from collections import defaultdict
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('directory', type=Path)
args = parser.parse_args()
directory = args.directory
manifest = json.loads((directory / 'manifest.json').read_text())
with gzip.open(directory / 'games.jsonl.gz', 'rt') as source:
    records = [json.loads(line) for line in source]
assert len(records) == manifest['totalGames']
challenger = manifest['challenger']['profile']
games = defaultdict(dict)  # (players, scenario, arm seat or None) -> seed -> record
for r in records:
    key = (r['numPlayers'], r['scenario'], r['challengerSeat'])
    assert r['seed'] not in games[key], f"duplicate {key} {r['seed']}"
    games[key][r['seed']] = r


def interval(values, z=1.959963984540054):
    mean = st.mean(values)
    half = z * st.stdev(values) / math.sqrt(len(values)) if len(values) > 1 else 0
    return {'mean': mean, 'low': mean - half, 'high': mean + half}


def share(record, seat):
    return 1 / len(record['winners']) if str(seat - 1) in record['winners'] else 0


def stars(counts, test):
    return sum(n for star, n in counts.items() if test(int(star)))


STAR_GROUPS = {'1': lambda s: s == 1, '2': lambda s: s == 2, 'advanced': lambda s: s >= 3}


def seat_metrics(record, seat):
    p = record['players'][seat - 1]
    assert p['seat'] == seat
    row = {'score': p['score'], 'cubePoints': p['cubePoints'], 'treePoints': p['treePoints'], 'grown': p['grown'],
           'advancedDraws': p['advancedDraws'], 'refills': p['refills']}
    for label, test in STAR_GROUPS.items():
        row[f'opened{label}'] = stars(p['openedByStar'], test)
        row[f'completed{label}'] = stars(p['completedByStar'], test)
        row[f'finished{label}'] = stars(p['finishedByStar'], test)
    row['opened'] = sum(p['openedByStar'].values())
    row['completed'] = sum(p['completedByStar'].values())
    row['finished'] = sum(p['finishedByStar'].values())
    return row


cells = []
for (count, scenario, seat) in sorted((k for k in games if k[2] is not None), key=lambda k: (k[0], k[1], k[2])):
    baseline = games[(count, scenario, None)]
    trial = games[(count, scenario, seat)]
    seeds = sorted(trial)
    assert seeds == sorted(baseline) and len(seeds) == manifest['gamesPerSeedSet']
    # Pairing check: the same seed reveals the same events in both arms.
    assert all(trial[s]['events'] == baseline[s]['events'] for s in seeds)
    assert all(trial[s]['players'][seat - 1]['profile'] == challenger for s in seeds)
    challenger_share = [share(trial[s], seat) for s in seeds]
    baseline_share = [share(baseline[s], seat) for s in seeds]
    win = interval(challenger_share)
    metric_names = list(seat_metrics(trial[seeds[0]], seat))
    challenger_metrics = {m: st.mean(seat_metrics(trial[s], seat)[m] for s in seeds) for m in metric_names}
    baseline_metrics = {m: st.mean(seat_metrics(baseline[s], seat)[m] for s in seeds) for m in metric_names}
    paired = {m: interval([seat_metrics(trial[s], seat)[m] - seat_metrics(baseline[s], seat)[m] for s in seeds])
              for m in ['score', 'cubePoints', 'treePoints', 'opened', 'completed', 'finished', 'advancedDraws']}
    others = []
    for other in range(1, count + 1):
        if other == seat:
            continue
        others.append({'seat': other,
                       'winShareChange': interval([share(trial[s], other) - share(baseline[s], other) for s in seeds]),
                       'scoreChange': interval([trial[s]['scores'][str(other - 1)] - baseline[s]['scores'][str(other - 1)] for s in seeds]),
                       'treePointsChange': interval([trial[s]['players'][other - 1]['treePoints'] - baseline[s]['players'][other - 1]['treePoints'] for s in seeds])})
    cells.append({'numPlayers': count, 'scenario': scenario, 'seat': seat, 'games': len(seeds),
                  'uniform': 1 / count,
                  'challengerWinShare': win,
                  'balancedWinShare': interval(baseline_share),
                  'pairedWinShareChange': interval([c - b for c, b in zip(challenger_share, baseline_share)]),
                  'aboveUniform': win['low'] > 1 / count,
                  'tiedGames': sum(len(trial[s]['winners']) > 1 for s in seeds),
                  'challenger': challenger_metrics, 'balanced': baseline_metrics, 'pairedChange': paired,
                  'otherSeats': others,
                  'msPerGame': {'challengerArm': st.mean(trial[s]['ms'] for s in seeds),
                                'balancedArm': st.mean(baseline[s]['ms'] for s in seeds)}})

success = all(c['aboveUniform'] for c in cells if c['scenario'] == 'A')
report = {'manifest': manifest, 'successScenarioA': success,
          'method': 'Each seed is played all-Balanced and with the challenger in one seat; Balanced plays every other seat. '
                    'Win shares split ties. Approximate 95% game-level normal intervals; paired intervals use within-seed '
                    'differences against Balanced in the same seat and seed. Exploratory bot-versus-bot simulation, not a '
                    'human population estimate.',
          'cells': cells}
(directory / 'analysis.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
with (directory / 'summary.csv').open('w') as out:
    writer = csv.writer(out)
    writer.writerow(['players', 'scenario', 'seat', 'games', 'challengerWinShare', 'low', 'high', 'balancedWinShare',
                     'pairedChange', 'pairedLow', 'pairedHigh', 'aboveUniform', 'challengerScore', 'balancedScore'])
    for c in cells:
        w, p = c['challengerWinShare'], c['pairedWinShareChange']
        writer.writerow([c['numPlayers'], c['scenario'], c['seat'], c['games'], *(round(x, 6) for x in (w['mean'], w['low'], w['high'],
                         c['balancedWinShare']['mean'], p['mean'], p['low'], p['high'])), c['aboveUniform'],
                         round(c['challenger']['score'], 4), round(c['balanced']['score'], 4)])
print((directory / 'summary.csv').read_text())
print('scenario A success:', success)
