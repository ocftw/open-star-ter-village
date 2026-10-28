"""Aggregate independent seed batches without loading all raw games at once."""
import argparse
from collections import Counter, defaultdict
import csv
import gzip
import hashlib
import json
from pathlib import Path
import statistics as st

parser = argparse.ArgumentParser()
parser.add_argument('batches', type=Path)
parser.add_argument('--out', type=Path, required=True)
parser.add_argument('--first', type=int, default=1)
parser.add_argument('--last', type=int, default=100)
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
# Exact t(99) for the requested 100 batches; conservative critical values for previews.
batch_count = args.last - args.first + 1
assert batch_count >= 2, 'At least two independent batches are needed for an uncertainty interval'
critical_small = {2: 12.7062047364, 3: 4.3026527297, 4: 3.1824463053, 5: 2.7764451052, 6: 2.5705818356}
critical_planned = {30: 2.0452296421, 60: 2.0009953781, 100: 1.9842169515}
z = critical_planned.get(batch_count, critical_small.get(batch_count, 2.4469118511 if batch_count < 30 else 2.0452296421 if batch_count < 100 else 1.9842169515))


def stats(values):
    mean = st.mean(values)
    half = z * st.stdev(values) / len(values) ** .5 if len(values) > 1 else 0
    return {'mean': mean, 'ci95': [mean - half, mean + half],
            'batchMin': min(values), 'batchMax': max(values),
            'batchP05': st.quantiles(values, n=20, method='inclusive')[0] if len(values) > 1 else mean,
            'batchP95': st.quantiles(values, n=20, method='inclusive')[-1] if len(values) > 1 else mean}


def game_metrics(r):
    scores = sorted(r['scores'].values(), reverse=True)
    return [st.mean(scores), scores[0] - scores[1], len(r['completedProjects']),
            int(any(n.endswith('-5') for n in r['grown'])), r['remainingHearts'],
            r['government5']['budget'], r['government5']['used'],
            sum(r['advancedDraws'].values()), sum(p['difficulty'] > 2 for p in r['completedProjects'])]


groups = defaultdict(list)
paired = defaultdict(list)
seat_differences = defaultdict(list)
manifests = []
raw_count = 0
raw_out = args.out / 'games.csv.gz'
with gzip.open(raw_out, 'wt', newline='') as out:
    writer = csv.writer(out)
    writer.writerow(['batch', 'gameIndex', 'players', 'scenario', 'score1', 'score2', 'score3', 'score4',
                     'winnersZeroBased', 'meanScore', 'margin', 'completions', 'tier5', 'hearts',
                     'government5Budget', 'government5Used', 'advancedDraws', 'advancedCompletions'])
    for batch in range(args.first, args.last + 1):
        root = args.batches / f'batch-{batch:03d}'
        manifest = json.loads((root / 'manifest.json').read_text())
        report = json.loads((root / 'analysis.json').read_text())
        assert manifest == report['manifest']
        assert manifest['failures'] == 0
        assert manifest['seedPrefix'] == f'standard-factorial-batch-{batch}'
        assert manifest['gamesPerScenarioPerPlayerCount'] == 300
        assert manifest['totalGames'] == 3600
        manifest['batch'] = batch
        manifest['rawSha256'] = hashlib.sha256((root / 'games.jsonl.gz').read_bytes()).hexdigest()
        manifests.append(manifest)
        for s in report['summaries']:
            groups[(s['numPlayers'], s['scenario'])].append(s)
        for p in report['pairedComparisons']:
            paired[(p['numPlayers'], p['comparison'])].append(p)
        for d in report['seatComparisons']:
            key = (d['numPlayers'], d['scenario'], d.get('baseline'), d.get('seat'), d.get('firstSeat'), d.get('secondSeat'))
            seat_differences[key].append(d.get('winShareChange', d.get('winShareDifference'))['mean'])
        count = 0
        raw_shares = defaultdict(lambda: defaultdict(float))
        raw_scores = defaultdict(list)
        with gzip.open(root / 'games.jsonl.gz', 'rt') as source:
            for line in source:
                r = json.loads(line)
                group = (r['numPlayers'], r['scenario'])
                for winner in r['winners']:
                    raw_shares[group][winner] += 1 / len(r['winners'])
                raw_scores[group].append(st.mean(r['scores'].values()))
                game_index = int(r['seed'].rsplit('-', 1)[1])
                assert r['seed'] == f"{manifest['seedPrefix']}-{r['numPlayers']}p-{game_index}"
                writer.writerow([batch, game_index, r['numPlayers'], r['scenario'],
                    *[r['scores'].get(str(i), '') for i in range(4)], '|'.join(r['winners']), *game_metrics(r)])
                count += 1
        assert count == 3600
        for summary in report['summaries']:
            group = (summary['numPlayers'], summary['scenario'])
            assert len(raw_scores[group]) == 300
            assert abs(st.mean(raw_scores[group]) - summary['metrics']['score']['mean']) < 1e-10
            for seat in summary['seats']:
                assert abs(raw_shares[group][str(seat['seat'] - 1)] / 300 - seat['winRate']['mean']) < 1e-10
        raw_count += count

assert len({m['build'] for m in manifests}) == 1
assert all(m['profile'] == manifests[0]['profile'] for m in manifests)
assert raw_count == len(manifests) * 3600
summaries = []
for (players, scenario), batches in sorted(groups.items()):
    assert len(batches) == len(manifests)
    seats = []
    for i in range(players):
        top = sum(abs(b['seats'][i]['winRate']['mean'] - max(s['winRate']['mean'] for s in b['seats'])) < 1e-12 for b in batches)
        sole = sum(all(b['seats'][i]['winRate']['mean'] > s['winRate']['mean'] + 1e-12 for j, s in enumerate(b['seats']) if i != j) for b in batches)
        seats.append({'seat': i + 1, 'winRate': stats([b['seats'][i]['winRate']['mean'] for b in batches]),
            'batchesTopIncludingTies': top, 'batchesSoleTop': sole,
            'meanScore': stats([b['seats'][i]['meanScore'] for b in batches])})
    gov_budget = sum(b['government5']['budget'] for b in batches)
    gov_used = sum(b['government5']['used'] for b in batches)
    difficulties = Counter()
    for b in batches:
        difficulties.update(b['completionsByDifficulty'])
    summaries.append({'numPlayers': players, 'scenario': scenario, 'games': sum(b['games'] for b in batches),
        'metrics': {key: stats([b['metrics'][key]['mean'] for b in batches]) for key in batches[0]['metrics']},
        'seats': seats, 'pooledSeatSpread': max(s['winRate']['mean'] for s in seats) - min(s['winRate']['mean'] for s in seats),
        'tieGames': sum(b['tieGames'] for b in batches),
        'government5': {'budget': gov_budget, 'used': gov_used, 'useRate': gov_used / gov_budget if gov_budget else None,
                       'gamesUnlocked': sum(b['government5']['gamesUnlocked'] for b in batches)},
        'completionsByDifficulty': dict(difficulties), 'advancedDraws': sum(b['advancedDraws'] for b in batches),
        'roundOrders': batches[0]['roundOrders'][0]['orders'],
        'fixedOrderVerified': all(len(b['roundOrders']) == 1 and all(r['players'] == [str(i) for i in range(players)] for r in b['roundOrders'][0]['orders']) for b in batches)})

comparisons = [{'numPlayers': players, 'comparison': label,
                'metrics': {k: stats([p['metrics'][k]['mean'] for p in batches]) for k in batches[0]['metrics']}}
               for (players, label), batches in sorted(paired.items())]
seat_comparisons = [{'numPlayers': k[0], 'scenario': k[1], 'baseline': k[2], 'seat': k[3],
                     'firstSeat': k[4], 'secondSeat': k[5], 'difference': stats(v)} for k, v in seat_differences.items()]
analysis = {'batches': len(manifests), 'totalGames': raw_count, 'failures': 0,
            'gamesPerScenarioPerPlayerCount': len(manifests) * 300,
            'build': manifests[0]['build'], 'profile': manifests[0]['profile'],
            'seedBatchRange': [args.first, args.last],
            'method': f'Equal-sized independent seed batches; shared seeds and events across rule options within batch. Split tied wins. Confidence intervals use critical value {z} across {len(manifests)} batch means (exact t critical value for planned 30/60/100-batch reports, conservative cutoff otherwise); 5th/95th percentile and min/max describe single-300-game-batch variation. Paired rule/seat changes computed within each batch. No human-balance inference.',
            'summaries': summaries, 'pairedComparisons': comparisons, 'seatComparisons': seat_comparisons}
(args.out / 'analysis.json').write_text(json.dumps(analysis, indent=2, ensure_ascii=False) + '\n')
(args.out / 'batch-manifests.json').write_text(json.dumps(manifests, indent=2) + '\n')
with (args.out / 'summary.csv').open('w') as out:
    writer = csv.writer(out)
    writer.writerow(['players', 'scenario', 'games', 'score', 'margin', 'completions', 'tier5', 'hearts', 'seatWinRates'])
    for s in summaries:
        writer.writerow([s['numPlayers'], s['scenario'], s['games'],
            *[round(s['metrics'][k]['mean'], 6) for k in ['score', 'winningMargin', 'completions', 'tier5', 'remainingHearts']],
            '|'.join(f"{seat['winRate']['mean']:.6f}" for seat in s['seats'])])
print((args.out / 'summary.csv').read_text())
