"""Summarize paired rule trials using Python's standard library; split tied wins."""
import argparse
import csv
import gzip
import json
import math
import statistics as st
from collections import Counter, defaultdict
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('directory', type=Path)
args = parser.parse_args()
directory = args.directory
manifest = json.loads((directory / 'manifest.json').read_text())
with gzip.open(directory / 'games.jsonl.gz', 'rt') as source:
    records = [json.loads(line) for line in source]
assert len(records) == manifest['totalGames']
by_group = defaultdict(list)
for r in records:
    by_group[(r['numPlayers'], r['scenario'])].append(r)


def interval(values, z=1.959963984540054):
    mean = st.mean(values)
    half = z * st.stdev(values) / math.sqrt(len(values)) if len(values) > 1 else 0
    return {'mean': mean, 'low': mean - half, 'high': mean + half}


def metrics(r):
    scores = sorted(r['scores'].values(), reverse=True)
    advanced = sum(p['difficulty'] > 2 for p in r['completedProjects'])
    return {
        'score': st.mean(scores), 'winningMargin': scores[0] - scores[1],
        'relativeMargin': (scores[0] - scores[1]) / st.mean(scores),
        'completions': len(r['completedProjects']), 'remainingHearts': r['remainingHearts'],
        'tier5': float(any(node.endswith('-5') for node in r['grown'])),
        'government5Used': r['government5']['used'],
        'advancedCompletions': advanced,
    }


summaries = []
seat_rows = []
for (count, scenario), games in sorted(by_group.items()):
    assert len(games) == manifest['gamesPerScenarioPerPlayerCount']
    assert len({g['seed'] for g in games}) == len(games)
    m = [metrics(g) for g in games]
    seats = []
    # Simultaneous 95% approximate normal intervals via Bonferroni across seats.
    z_family = st.NormalDist().inv_cdf(1 - 0.05 / (2 * count))
    for seat in range(count):
        key = str(seat)
        shares = [1 / len(g['winners']) if key in g['winners'] else 0 for g in games]
        ci = interval(shares)
        family = interval(shares, z_family)
        wins = sum(len(g['winners']) == 1 and key in g['winners'] for g in games)
        tied_wins = sum(len(g['winners']) > 1 and key in g['winners'] for g in games)
        tree_points = [sum([1, 1, 2, 2, 4][int(log['target'].split('-')[1]) - 1]
                           for log in g['growth'] if log['playerId'] == key) for g in games]
        row = {'numPlayers': count, 'scenario': scenario, 'seat': seat + 1,
               'splitWins': sum(shares), 'outrightWins': wins, 'tiedWins': tied_wins,
               'winRate': ci, 'simultaneous95': family,
               'aboveUniform': family['low'] > 1 / count,
               'belowUniform': family['high'] < 1 / count,
               'meanScore': st.mean(g['scores'][key] for g in games),
               'meanTreePoints': st.mean(tree_points),
               'meanInitiatedCompletions': st.mean(sum(p['initiator'] == key for p in g['completedProjects']) for g in games),
               'meanFinishedCompletions': st.mean(sum(p['finisher'] == key for p in g['completedProjects']) for g in games)}
        seats.append(row)
        seat_rows.append(row)
    assert abs(sum(s['winRate']['mean'] for s in seats) - 1) < 1e-10
    total_budget = sum(g['government5']['budget'] for g in games)
    total_used = sum(g['government5']['used'] for g in games)
    difficulty = Counter(str(p['difficulty']) for g in games for p in g['completedProjects'])
    orders = Counter(json.dumps(g['roundActionOrder'], separators=(',', ':')) for g in games)
    summaries.append({'numPlayers': count, 'scenario': scenario, 'games': len(games),
        'metrics': {k: interval([v[k] for v in m]) for k in m[0]},
        'seatSpread': max(s['winRate']['mean'] for s in seats) - min(s['winRate']['mean'] for s in seats),
        'tieGames': sum(len(g['winners']) > 1 for g in games),
        'seats': seats, 'completionsByDifficulty': dict(difficulty),
        'tierReach': {str(t): st.mean(any(node.endswith(f'-{t}') for node in g['grown']) for g in games) for t in [3, 4, 5]},
        'government5': {'gamesUnlocked': sum('government-5' in g['grown'] for g in games),
            'budget': total_budget, 'used': total_used, 'useRate': total_used / total_budget if total_budget else None,
            'resolved': sum(g['choices'].get('government5', {}).get('resolved', 0) for g in games),
            'skipped': sum(g['choices'].get('government5', {}).get('skipped', 0) for g in games),
            'noTarget': sum(g['choices'].get('government5', {}).get('noTarget', 0) for g in games)},
        'advancedDraws': sum(sum(g['advancedDraws'].values()) for g in games),
        'roundOrders': [{'orders': json.loads(order), 'games': n} for order, n in orders.items()]})

comparisons = []
for count in [2, 3, 4]:
    lookup = {s: {g['seed']: g for g in by_group[(count, s)]} for s in 'ABCD'}
    seeds = sorted(lookup['A'])
    assert all(set(lookup[s]) == set(seeds) for s in 'ABCD')
    # Verify actual revealed events match, not just the random-seed labels.
    assert all(lookup[s][seed]['events'] == lookup['A'][seed]['events'] for s in 'BCD' for seed in seeds)
    weights = {
        'B-A': {'B': 1, 'A': -1}, 'C-A': {'C': 1, 'A': -1}, 'D-A': {'D': 1, 'A': -1},
        'government5MainEffect': {'B': 0.5, 'A': -0.5, 'D': 0.5, 'C': -0.5},
        'difficultyMainEffect': {'C': 0.5, 'A': -0.5, 'D': 0.5, 'B': -0.5},
        'interaction': {'D': 1, 'C': -1, 'B': -1, 'A': 1},
    }
    for label, coefficients in weights.items():
        delta = {key: [] for key in metrics(lookup['A'][seeds[0]])}
        for seed in seeds:
            for key in delta:
                delta[key].append(sum(weight * metrics(lookup[s][seed])[key] for s, weight in coefficients.items()))
        comparisons.append({'numPlayers': count, 'comparison': label, 'metrics': {k: interval(v) for k, v in delta.items()}})

seat_comparisons = []
for count in [2, 3, 4]:
    lookup = {s: {g['seed']: g for g in by_group[(count, s)]} for s in 'ABCD'}
    seeds = sorted(lookup['A'])
    def win_share(g, seat):
        return 1 / len(g['winners']) if str(seat) in g['winners'] else 0
    for scenario in 'ABCD':
        for first in range(count):
            for second in range(first + 1, count):
                seat_comparisons.append({'numPlayers': count, 'scenario': scenario,
                    'firstSeat': first + 1, 'secondSeat': second + 1,
                    'winShareDifference': interval([win_share(lookup[scenario][seed], first) - win_share(lookup[scenario][seed], second) for seed in seeds])})
    for scenario in 'BCD':
        for seat in range(count):
            seat_comparisons.append({'numPlayers': count, 'scenario': scenario, 'baseline': 'A',
                'seat': seat + 1, 'winShareChange': interval([win_share(lookup[scenario][seed], seat) - win_share(lookup['A'][seed], seat) for seed in seeds])})

report = {'seatComparisons': seat_comparisons, 'manifest': manifest, 'method': 'Same seed and revealed event sequence paired across options. Win shares split ties. Approximate 95% game-level normal intervals; simultaneous seat intervals Bonferroni-adjusted within each count/scenario. Paired metric intervals use within-seed differences. No population-of-humans inference.',
          'summaries': summaries, 'pairedComparisons': comparisons}
(directory / 'analysis.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
with (directory / 'summary.csv').open('w') as out:
    writer = csv.writer(out)
    writer.writerow(['players', 'scenario', 'games', 'meanScore', 'margin', 'relativeMargin', 'completions', 'tier5', 'hearts', 'government5Used', 'seatWinRates'])
    for s in summaries:
        writer.writerow([s['numPlayers'], s['scenario'], s['games'], *[round(s['metrics'][k]['mean'], 6) for k in ['score', 'winningMargin', 'relativeMargin', 'completions', 'tier5', 'remainingHearts', 'government5Used']], '|'.join(f"{seat['winRate']['mean']:.6f}" for seat in s['seats'])])
print((directory / 'summary.csv').read_text())
for c in comparisons:
    if c['comparison'] in ['B-A', 'C-A', 'D-A']:
        print(c['numPlayers'], c['comparison'], {k: {a: round(v, 3) for a, v in ci.items()} for k, ci in c['metrics'].items() if k in ['score', 'winningMargin', 'completions']})
