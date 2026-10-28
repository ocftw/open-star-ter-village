"""Render analysis.json from analyze-standard-sweep.py into a self-contained HTML report.

    python3 scripts/report-standard-sweep.py bot-runs/sweep72 [report.html]
"""
import json
from pathlib import Path
import sys

run = Path(sys.argv[1])
target = Path(sys.argv[2]) if len(sys.argv) > 2 else run / 'report.html'
analysis = json.loads((run / 'analysis.json').read_text())
# Scenario metadata is enough for the report; drop the heavy manifest fields.
analysis['manifest'] = {k: v for k, v in analysis['manifest'].items() if k not in ('scenarios', 'strategies')}
data = json.dumps(analysis, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
template = (Path(__file__).parent / 'standard-sweep-report.html').read_text()
target.write_text(template.replace('/*DATA*/', data))
print(f'{target} ({target.stat().st_size // 1024} KB)')
