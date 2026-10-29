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
        for rule, style in [('v1', 'legacy'), ('v2-collab', 'legacy'), ('v2-maintenance', 'legacy'), ('v1', 'bundle'), ('v2-collab', 'bundle')]:
            with self.subTest(rule=rule, style=style), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                (root / 'b01').mkdir()
                record = {'n': 2, 'c': 'AA', 'sc': [5, 4], 'w': [0], 'rd': 7, 'mv': 20,
                          'f20': [-1, 5], 'g': [], 'tp': 0, 'p': [], 'ad': [0, 0],
                          'g5': [0, 0], 'bd': {'協作合約': [2, 0], '維運合約': [0, 1], '行動獎勵': [3, 3]}}
                record['fg'] = [2, 3]
                with gzip.open(root / 'b01/s00.jsonl.gz', 'wt') as f:
                    f.write(json.dumps(record) + '\n')
                scenario = {'id': 'fixture', 'standardOptions': {}, 'experiments': {'completionRewards': 'fixed'}}
                if style == 'bundle':
                    # Current manifests name the feature bundle beside the room options.
                    scenario['treeRules'] = rule
                elif rule != 'v1':
                    # Legacy manifests kept treeRules in the room options, and v1 ones may omit it.
                    scenario['standardOptions'] = {'treeRules': rule}
                manifest = {'scenarioIndexes': [0], 'playerCounts': [2], 'scenarios': [scenario]}
                (root / 'manifest.json').write_text(json.dumps(manifest))
                subprocess.run([sys.executable, str(SCRIPT), str(root), '--workers', '1'], check=True, capture_output=True)
                row = json.loads((root / 'analysis.json').read_text())['scenarios'][0]
                self.assertEqual(row['options']['treeRules'], rule)
                self.assertEqual(row['firstOver20Round'], [None, 5])
                self.assertEqual(row['firstAdvancedGateRound'], [2, 3])
                self.assertEqual(row['firstAdvancedGateRate'], [1, 1])
                self.assertEqual(row['breakdown']['A']['協作合約'], 1)
                self.assertEqual(row['breakdown']['A']['維運合約'], .5)
                self.assertEqual(row['breakdownResidual'], 0)


if __name__ == '__main__':
    unittest.main()
