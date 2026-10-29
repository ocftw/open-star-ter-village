"""Synthetic records verify schema handling; these are not playtest evidence."""
import gzip
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('analyze-standard-sweep.py')



class TreeRulesAnalysisTest(unittest.TestCase):
    def test_gate_and_contract_labels_survive_analysis(self):
        for rule in ['v1', 'v2-collab', 'v2-maintenance']:
            with self.subTest(rule=rule), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                (root / 'b01').mkdir()
                record = {'n': 2, 'c': 'AA', 'sc': [5, 4], 'w': [0], 'rd': 7, 'mv': 20,
                          'f20': [-1, 5], 'g': [], 'tp': 0, 'p': [], 'ad': [0, 0],
                          'g5': [0, 0], 'bd': {'協作合約': [2, 0], '維運合約': [0, 1], '行動獎勵': [3, 3]}}
                if rule != 'v1':
                    record['fg'] = [2, 3]
                with gzip.open(root / 'b01/s00.jsonl.gz', 'wt') as f:
                    f.write(json.dumps(record) + '\n')
                # Legacy v1 manifests may omit treeRules entirely.
                options = {} if rule == 'v1' else {'treeRules': rule}
                manifest = {'scenarioIndexes': [0], 'playerCounts': [2], 'scenarios': [
                    {'id': 'fixture', 'standardOptions': options, 'experiments': {'completionRewards': 'fixed'}}]}
                (root / 'manifest.json').write_text(json.dumps(manifest))
                subprocess.run([sys.executable, str(SCRIPT), str(root), '--workers', '1'], check=True, capture_output=True)
                row = json.loads((root / 'analysis.json').read_text())['scenarios'][0]
                self.assertEqual(row['options']['treeRules'], rule)
                self.assertEqual(row['firstAdvancedGateRound'], [None, 5] if rule == 'v1' else [2, 3])
                self.assertEqual(row['firstAdvancedGateRate'], [0, 1] if rule == 'v1' else [1, 1])
                self.assertEqual(row['breakdown']['A']['協作合約'], 1)
                self.assertEqual(row['breakdown']['A']['維運合約'], .5)
                self.assertEqual(row['breakdownResidual'], 0)


if __name__ == '__main__':
    unittest.main()
