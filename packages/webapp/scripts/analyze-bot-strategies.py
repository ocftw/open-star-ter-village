"""Summarize paired challenger-vs-Novice trials using Python's standard library; split tied wins."""
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
for (count, scenario, seat) in sorted(k for k in games if k[2] is not None):
    baseline = games[(count, scenario, None)]
    trial = games[(count, scenario, seat)]
    seeds = sorted(trial)
    assert seeds == sorted(baseline) and len(seeds) == manifest['gamesPerSeedSet']
    # Pairing check: the same seed reveals the same events in both arms.
    assert all(trial[s]['events'] == baseline[s]['events'] for s in seeds)
    assert all(trial[s]['players'][seat - 1]['profile'] == challenger for s in seeds)

    def delta(value):
        # Paired within-seed difference: challenger arm minus all-Novice.
        return interval([value(trial[s]) - value(baseline[s]) for s in seeds])

    win = interval([share(trial[s], seat) for s in seeds])
    trial_metrics = [seat_metrics(trial[s], seat) for s in seeds]
    baseline_metrics = [seat_metrics(baseline[s], seat) for s in seeds]
    challenger_means = {m: st.mean(row[m] for row in trial_metrics) for m in trial_metrics[0]}
    baseline_means = {m: st.mean(row[m] for row in baseline_metrics) for m in baseline_metrics[0]}
    paired = {m: interval([t[m] - b[m] for t, b in zip(trial_metrics, baseline_metrics)])
              for m in ['score', 'cubePoints', 'treePoints', 'opened', 'completed', 'finished', 'advancedDraws']}
    others = [{'seat': other,
               'winShareChange': delta(lambda r: share(r, other)),
               'scoreChange': delta(lambda r: r['scores'][str(other - 1)]),
               'treePointsChange': delta(lambda r: r['players'][other - 1]['treePoints'])}
              for other in range(1, count + 1) if other != seat]
    cells.append({'numPlayers': count, 'scenario': scenario, 'seat': seat, 'games': len(seeds),
                  'uniform': 1 / count,
                  'challengerWinShare': win,
                  'noviceWinShare': interval([share(baseline[s], seat) for s in seeds]),
                  'pairedWinShareChange': delta(lambda r: share(r, seat)),
                  'aboveUniform': win['low'] > 1 / count,
                  'tiedGames': sum(len(trial[s]['winners']) > 1 for s in seeds),
                  'challenger': challenger_means, 'novice': baseline_means, 'pairedChange': paired,
                  'otherSeats': others,
                  'msPerGame': {'challengerArm': st.mean(trial[s]['ms'] for s in seeds),
                                'noviceArm': st.mean(baseline[s]['ms'] for s in seeds)}})

# The task's pass rule: every scenario A cell above uniform; None when A was not run.
scenario_a = [c['aboveUniform'] for c in cells if c['scenario'] == 'A']
success = all(scenario_a) if scenario_a else None
report = {'manifest': manifest, 'successScenarioA': success,
          'method': 'Each seed is played all-Novice and with the challenger in one seat; Novice plays every other seat. '
                    'Win shares split ties. Approximate 95% game-level normal intervals; paired intervals use within-seed '
                    'differences against Novice in the same seat and seed. Exploratory bot-versus-bot simulation, not a '
                    'human population estimate.',
          'cells': cells}
(directory / 'analysis.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
with (directory / 'summary.csv').open('w') as out:
    writer = csv.writer(out)
    writer.writerow(['players', 'scenario', 'seat', 'games', 'challengerWinShare', 'low', 'high', 'noviceWinShare',
                     'pairedChange', 'pairedLow', 'pairedHigh', 'aboveUniform', 'challengerScore', 'noviceScore'])
    for c in cells:
        w, p = c['challengerWinShare'], c['pairedWinShareChange']
        writer.writerow([c['numPlayers'], c['scenario'], c['seat'], c['games'], *(round(x, 6) for x in (w['mean'], w['low'], w['high'],
                         c['noviceWinShare']['mean'], p['mean'], p['low'], p['high'])), c['aboveUniform'],
                         round(c['challenger']['score'], 4), round(c['novice']['score'], 4)])
print((directory / 'summary.csv').read_text())
print('scenario A success:', success)
