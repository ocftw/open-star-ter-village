"""Aggregate a sweep-standard-scenarios.ts run into analysis.json.

    python3 scripts/analyze-standard-sweep.py bot-runs/sweep72 [--workers 10]

Partial sweeps are fine: only finished (batch, scenario) files are read, and
the batch count used is reported.
"""
import argparse
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor
import gzip
import json
import math
from pathlib import Path

NODES = [f'{b}{t}' for b in 'sdg' for t in range(1, 6)]
NODE_INDEX = {node: i for i, node in enumerate(NODES)}
MAX_ROUNDS = 10
# Runs from before the rename wrote Balanced/Counter as B/C.
LEGACY_SEATS = str.maketrans('BC', 'NA')


def new_cell(n):
    return {
        'games': 0, 'failures': 0, 'ties': 0, 'margin': 0, 'top': 0, 'rounds': 0, 'moves': 0,
        'win': [0.0] * n, 'score': [0] * n, 'score2': [0] * n,
        'grownHist': [0] * 11, 'tierHist': [0] * 6, 'node': [0] * 15, 'nodeRound': [0] * 15,
        'nodeBy': {'N': [0] * 15, 'A': [0] * 15}, 'growRound': [0] * MAX_ROUNDS, 'tp': 0,
        'played': [0] * 5, 'completed': [0] * 5, 'completedRound': [0] * 5,
        'playedBy': {'N': [0] * 5, 'A': [0] * 5}, 'completedBy': {'N': [0] * 5, 'A': [0] * 5},
        'finishedBy': {'N': [0] * 5, 'A': [0] * 5},
        'breakdown': {'N': defaultdict(int), 'A': defaultdict(int)}, 'residual': 0,
        'advancedDraws': {'N': 0, 'A': 0}, 'g5': [0, 0], 'f20': [0] * n, 'f20n': [0] * n,
    }


def category(reason):
    return 'tree' if reason.startswith('星源樹成長') else reason


def read_file(path):
    batch = int(path.parent.name[1:])
    scenario = int(path.stem.split('.')[0][1:])
    cells = {}
    per_batch = {}
    with gzip.open(path, 'rt') as f:
        for line in f:
            g = json.loads(line)
            n, combo = g['n'], g['c'].translate(LEGACY_SEATS)
            key = (scenario, n, combo)
            cell = cells.setdefault(key, new_cell(n))
            pb = per_batch.setdefault(key, {'games': 0, 'win': [0.0] * n})
            if 'err' in g:
                cell['failures'] += 1
                continue
            cell['games'] += 1
            pb['games'] += 1
            sc, winners = g['sc'], g['w']
            share = 1 / len(winners)
            for seat in winners:
                cell['win'][seat] += share
                pb['win'][seat] += share
            if len(winners) > 1:
                cell['ties'] += 1
            ordered = sorted(sc, reverse=True)
            cell['margin'] += ordered[0] - ordered[1]
            cell['top'] += ordered[0]
            cell['rounds'] += g['rd']
            cell['moves'] += g['mv']
            for seat, s in enumerate(sc):
                cell['score'][seat] += s
                cell['score2'][seat] += s * s
            for seat, r in enumerate(g['f20']):
                if r >= 0:
                    cell['f20'][seat] += r
                    cell['f20n'][seat] += 1
            grows = g['g']
            cell['grownHist'][len(grows)] += 1
            cell['tierHist'][max((int(node[1]) for _, _, node in grows), default=0)] += 1
            for rnd, seat, node in grows:
                i = NODE_INDEX[node]
                cell['node'][i] += 1
                cell['nodeRound'][i] += rnd
                cell['nodeBy'][combo[seat]][i] += 1
                cell['growRound'][rnd - 1] += 1
            cell['tp'] += g['tp']
            for stars, initiator, _, finisher, completed_round in g['p']:
                cell['played'][stars] += 1
                cell['playedBy'][combo[initiator]][stars] += 1
                if finisher >= 0:
                    cell['completed'][stars] += 1
                    cell['completedRound'][stars] += completed_round
                    cell['completedBy'][combo[initiator]][stars] += 1
                    cell['finishedBy'][combo[finisher]][stars] += 1
            total = [0] * n
            for reason, values in g['bd'].items():
                cat = category(reason)
                for seat, v in enumerate(values):
                    cell['breakdown'][combo[seat]][cat] += v
                    total[seat] += v
            cell['residual'] += sum(abs(a - b) for a, b in zip(sc, total))
            for seat, d in enumerate(g['ad']):
                cell['advancedDraws'][combo[seat]] += d
            cell['g5'][0] += g['g5'][0]
            cell['g5'][1] += g['g5'][1]
    return batch, cells, per_batch


def merge(into, cell):
    for k, v in cell.items():
        if isinstance(v, list):
            into[k] = [a + b for a, b in zip(into[k], v)]
        elif isinstance(v, dict):
            for s, inner in v.items():
                if isinstance(inner, list):
                    into[k][s] = [a + b for a, b in zip(into[k][s], inner)]
                elif isinstance(inner, dict):
                    for c, x in inner.items():
                        into[k][s][c] += x
                else:
                    into[k][s] += inner
        else:
            into[k] += v


def mean_sd(values):
    m = sum(values) / len(values)
    sd = math.sqrt(sum((x - m) ** 2 for x in values) / (len(values) - 1)) if len(values) > 1 else 0
    return m, sd


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('run', type=Path)
    parser.add_argument('--workers', type=int, default=10)
    args = parser.parse_args()
    manifest = json.loads((args.run / 'manifest.json').read_text())
    files = sorted(args.run.glob('b*/s*.jsonl.gz'))
    batches_by_scenario = defaultdict(set)
    for path in files:
        batches_by_scenario[int(path.stem.split('.')[0][1:])].add(int(path.parent.name[1:]))
    # Use only batches finished for every scenario, so scenarios stay paired.
    complete = sorted(set.intersection(*batches_by_scenario.values())) if len(batches_by_scenario) == 72 else []
    assert complete, 'no batch is complete for all 72 scenarios yet'
    files = [p for p in files if int(p.parent.name[1:]) in complete]

    cells = {}
    batch_wins = defaultdict(dict)  # (scenario, n) -> batch -> seat win shares pooled over combos
    batch_strategy = defaultdict(dict)  # (scenario, n) -> batch -> [A wins, A seats, N wins, N seats] in mixed tables
    with ProcessPoolExecutor(args.workers) as pool:
        for batch, part, per_batch in pool.map(read_file, files, chunksize=4):
            for key, cell in part.items():
                if key not in cells:
                    cells[key] = new_cell(key[1])
                merge(cells[key], cell)
            for (scenario, n, combo), pb in per_batch.items():
                slot = batch_wins[(scenario, n)].setdefault(batch, [[0.0] * n, 0])
                slot[0] = [a + b for a, b in zip(slot[0], pb['win'])]
                slot[1] += pb['games']
                if 'N' in combo and 'A' in combo:
                    st = batch_strategy[(scenario, n)].setdefault(batch, [0.0, 0, 0.0, 0])
                    for seat, k in enumerate(combo):
                        st[0 if k == 'A' else 2] += pb['win'][seat]
                        st[1 if k == 'A' else 3] += pb['games']

    scenarios = manifest['scenarios']
    out = {'manifest': manifest, 'batchesUsed': complete, 'nodes': NODES, 'scenarios': [], 'combos': []}
    for (scenario, n, combo), c in sorted(cells.items()):
        g = c['games']
        out['combos'].append({'scenario': scenario, 'n': n, 'combo': combo, 'games': g, 'failures': c['failures'],
                              'winRate': [w / g for w in c['win']], 'meanScore': [s / g for s in c['score']]})
    for scenario in range(72):
        for n in manifest['playerCounts']:
            group = [c for (s, nn, _), c in cells.items() if s == scenario and nn == n]
            total = new_cell(n)
            for c in group:
                merge(total, c)
            g = total['games']
            seats = [w / g for w in total['win']]
            per_batch = batch_wins[(scenario, n)]
            seat_se = []
            for seat in range(n):
                _, sd = mean_sd([v[0][seat] / v[1] for v in per_batch.values()])
                seat_se.append(sd / math.sqrt(len(per_batch)))
            # Advance minus Novice per-player win rate, only where a table seats both.
            strategy = batch_strategy.get((scenario, n), {})
            a_rates = [v[0] / v[1] for v in strategy.values()]
            n_rates = [v[2] / v[3] for v in strategy.values()]
            a_adv = [a - b for a, b in zip(a_rates, n_rates)]
            a_adv_m, a_adv_sd = mean_sd(a_adv) if a_adv else (None, None)
            games_by = {k: sum(c['games'] * combo.count(k) for (s, nn, combo), c in cells.items() if s == scenario and nn == n) for k in 'NA'}
            per = lambda k, x: x / games_by[k] if games_by[k] else None
            out['scenarios'].append({
                'index': scenario, 'id': scenarios[scenario]['id'], 'n': n, 'games': g, 'failures': total['failures'],
                'options': scenarios[scenario]['standardOptions'], 'rewards': scenarios[scenario]['experiments']['completionRewards'],
                'seatWin': seats, 'seatWinSE': seat_se, 'seatImbalance': max(abs(w - 1 / n) for w in seats),
                'seatScore': [s / g for s in total['score']],
                'scoreSD': math.sqrt(max(0, sum(total['score2']) / (g * n) - (sum(total['score']) / (g * n)) ** 2)),
                'meanScore': sum(total['score']) / (g * n), 'topScore': total['top'] / g, 'margin': total['margin'] / g,
                'tieRate': total['ties'] / g, 'rounds': total['rounds'] / g, 'moves': total['moves'] / g,
                'advanceAdvantage': a_adv_m, 'advanceAdvantageSE': a_adv_sd / math.sqrt(len(a_adv)) if a_adv else None,
                'seatGames': games_by,
                'grown': sum(i * h for i, h in enumerate(total['grownHist'])) / g,
                'grownHist': [h / g for h in total['grownHist']], 'tierHist': [h / g for h in total['tierHist']],
                'nodeRate': [x / g for x in total['node']],
                'nodeRound': [r / x if x else None for r, x in zip(total['nodeRound'], total['node'])],
                'nodeByStrategy': {k: [per(k, x) for x in v] for k, v in total['nodeBy'].items() if games_by[k]},
                'growRound': [x / g for x in total['growRound']], 'treeProgress': total['tp'] / g,
                'played': [x / g for x in total['played']], 'completed': [x / g for x in total['completed']],
                'completedRound': [r / x if x else None for r, x in zip(total['completedRound'], total['completed'])],
                'playedBy': {k: [per(k, x) for x in v] for k, v in total['playedBy'].items() if games_by[k]},
                'completedBy': {k: [per(k, x) for x in v] for k, v in total['completedBy'].items() if games_by[k]},
                'finishedBy': {k: [per(k, x) for x in v] for k, v in total['finishedBy'].items() if games_by[k]},
                'breakdown': {k: {cat: per(k, x) for cat, x in v.items()} for k, v in total['breakdown'].items() if games_by[k]},
                'breakdownResidual': total['residual'] / g,
                'advancedDraws': {k: per(k, total['advancedDraws'][k]) for k in 'NA' if games_by[k]},
                'government5': [x / g for x in total['g5']],
                'firstOver20Round': [r / m if m else None for r, m in zip(total['f20'], total['f20n'])],
                'firstOver20Rate': [m / g for m in total['f20n']],
            })
    target = args.run / 'analysis.json'
    target.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    games = sum(s['games'] for s in out['scenarios'])
    failures = sum(s['failures'] for s in out['scenarios'])
    print(f'{games} games ({failures} failures) from {len(complete)} batches -> {target}')


if __name__ == '__main__':
    main()
