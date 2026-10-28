"""Resume independent paired seed batches; run this from any working directory."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from pathlib import Path
import subprocess
import time

parser = argparse.ArgumentParser()
parser.add_argument('--first', type=int, default=1)
parser.add_argument('--last', type=int, default=100)
parser.add_argument('--games', type=int, default=300)
parser.add_argument('--workers', type=int, default=6)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
assert 1 <= args.first <= args.last and args.games > 0 and args.workers > 0
webapp = Path(__file__).resolve().parents[1]
root = args.out.resolve()
root.mkdir(parents=True, exist_ok=True)
started = time.monotonic()


def run_batch(batch):
    directory = root / f'batch-{batch:03d}'
    directory.mkdir(exist_ok=True)
    prefix = f'standard-factorial-batch-{batch}'
    manifest = directory / 'manifest.json'
    if manifest.exists():
        previous = json.loads(manifest.read_text())
        assert previous['seedPrefix'] == prefix
        assert previous['gamesPerScenarioPerPlayerCount'] == args.games
        assert previous['totalGames'] == args.games * 12 and previous['failures'] == 0
    else:
        with (directory / 'run.log').open('w') as log:
            subprocess.run(['pnpm', 'exec', 'tsx', 'scripts/compare-standard-experiments.ts',
                '--games', str(args.games), '--seed', prefix, '--out', str(directory)],
                cwd=webapp, stdout=log, stderr=subprocess.STDOUT, check=True)
    if not (directory / 'analysis.json').exists():
        with (directory / 'analysis.log').open('w') as log:
            subprocess.run(['python3', str(webapp / 'scripts/analyze-standard-experiments.py'), str(directory)],
                cwd=webapp, stdout=log, stderr=subprocess.STDOUT, check=True)
    return batch


completed = []
failures = []
with ThreadPoolExecutor(max_workers=args.workers) as pool:
    tasks = {pool.submit(run_batch, batch): batch for batch in range(args.first, args.last + 1)}
    for task in as_completed(tasks):
        batch = tasks[task]
        try:
            completed.append(task.result())
        except Exception as error:
            failures.append({'batch': batch, 'error': str(error)})
        progress = {'first': args.first, 'last': args.last, 'gamesPerOptionPerCountPerBatch': args.games,
                    'completedBatches': sorted(completed), 'failures': failures,
                    'elapsedSeconds': round(time.monotonic() - started, 1)}
        (root / 'progress.json').write_text(json.dumps(progress, indent=2) + '\n')
        print(f"{len(completed)}/{args.last - args.first + 1} batches complete, {len(failures)} failed, {progress['elapsedSeconds']}s", flush=True)
if failures:
    raise SystemExit(1)
