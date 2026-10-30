"""Read-only audit: run from repository root with Python 3, no dependencies."""
import collections
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
cards = json.loads((root / 'src/game/data/card/projects.json').read_text())
by_name = {c['name']: c for c in cards}
report = {'catalog': [], 'games': []}
for difficulty in range(1, 5):
    group = [c for c in cards if c['difficulty'] == difficulty]
    needs = [sum(c['requirements'].values()) for c in group]
    report['catalog'].append({'difficulty': difficulty, 'count': len(group), 'contribution_min': min(needs), 'contribution_max': max(needs), 'fixed_bonuses': 4, 'candidate_bonuses': difficulty * 2})
for path in sorted((root / 'docs/evidence/standard-poc').glob('tree-poc-*.json')):
    game = json.loads(path.read_text())
    names = [e['target'] for e in game['log'] if e['kind'] == 'complete']
    known = [by_name[n] for n in names if n in by_name]
    report['games'].append({'file': path.name, 'players': game['players'], 'completed': len(game['completedProjectIds']), 'completion_difficulties': dict(collections.Counter(c['difficulty'] for c in known)), 'unmatched_names': [n for n in names if n not in by_name], 'remaining_hearts': game['remainingHearts'], 'government5_grown': 'government-5' in game['grown'], 'candidate_total_bonus_delta': sum(2 * (c['difficulty'] - 2) for c in known)})
print(json.dumps(report, ensure_ascii=False, indent=2))
