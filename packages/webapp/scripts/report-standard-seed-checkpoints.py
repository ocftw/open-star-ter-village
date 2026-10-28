"""Generate immutable cumulative reports at batches 30, 60 and 100 as they finish."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import time

parser = argparse.ArgumentParser()
parser.add_argument('batches', type=Path)
parser.add_argument('--out', type=Path, required=True)
parser.add_argument('--plot-python', default=sys.executable)
args = parser.parse_args()
webapp = Path(__file__).resolve().parents[1]
root = args.batches.resolve()
output = args.out.resolve()
output.mkdir(parents=True, exist_ok=True)
completed = []
labels = {'A': '既有方塊／各 +2', 'B': '可新增方塊／各 +2', 'C': '既有方塊／依星數', 'D': '可新增方塊／依星數'}


def percent(value):
    return f'{value * 100:.2f}%'


def generate_text(report, checkpoint):
    kind = '最終' if checkpoint == 100 else '初步'
    lines = [f'# 種子批次 1～{checkpoint}：{kind}報告', '',
        f"產生時間：{datetime.now(timezone.utc).isoformat()}。累積 **{report['totalGames']:,} 場**，零失敗；每種規則與人數 **{report['gamesPerScenarioPerPlayerCount']:,} 場**。", '',
        '同一 Balanced 策略、相同權重；每批四組共用發牌與事件種子；平手均分勝率。所有批次沿用原遊戲實作，沒有修正先手輪替或調整任何平衡值。', '',
        '這是累積報告：60 組包含前 30 組，100 組包含前 60 組，三份不是互相獨立的實驗。', '',
        '| 組合 | 政府 5／結案獎勵 |', '| --- | --- |']
    lines += [f'| {k} | {v} |' for k, v in labels.items()]
    lines += ['', '## 座位勝率', '', '座位按第 1→第 4 位排列，對應程式 player ID 0→3。', '',
        '| 人數 | 組合 | 第 1 位 | 第 2 位 | 第 3 位 | 第 4 位 |', '| --- | --- | ---: | ---: | ---: | ---: |']
    for s in report['summaries']:
        rates = [percent(x['winRate']['mean']) for x in s['seats']]
        rates += ['—'] * (4 - len(rates))
        lines.append(f"| {s['numPlayers']} | {s['scenario']} | " + ' | '.join(rates) + ' |')
    lines += ['', '## 遊戲進度與領先差距', '',
        '| 人數 | 組合 | 平均得分 | 冠亞軍差 | 每場結案 | 第五層到達率 | 剩餘愛心 |',
        '| --- | --- | ---: | ---: | ---: | ---: | ---: |']
    for s in report['summaries']:
        m = s['metrics']
        lines.append(f"| {s['numPlayers']} | {s['scenario']} | {m['score']['mean']:.2f} | {m['winningMargin']['mean']:.2f} | {m['completions']['mean']:.2f} | {percent(m['tier5']['mean'])} | {m['remainingHearts']['mean']:.2f} |")
    lines += ['', '## 四人局：跨種子批次的波動', '',
        '95% CI 是累積平均的區間，以各批平均值計算；P05～P95 是單批 300 場估計的波動範圍，兩者用途不同。最高批次數包含並列，所以加總可能大於批次總數。', '',
        '| 組合 | 座位 | 總勝率 | 平均勝率 95% CI | 單批 P05～P95 | 最高批次數 |',
        '| --- | --- | ---: | --- | --- | ---: |']
    for s in report['summaries']:
        if s['numPlayers'] != 4:
            continue
        for seat in s['seats']:
            r = seat['winRate']
            lines.append(f"| {s['scenario']} | {seat['seat']} | {percent(r['mean'])} | {percent(r['ci95'][0])}～{percent(r['ci95'][1])} | {percent(r['batchP05'])}～{percent(r['batchP95'])} | {seat['batchesTopIncludingTies']}/{checkpoint} |")
    lines += ['', '## 四人局：同種子配對比較', '', '| 比較 | 指標 | 平均差 | 95% CI |', '| --- | --- | ---: | --- |']
    for c in report['pairedComparisons']:
        if c['numPlayers'] == 4 and c['comparison'] in ['B-A', 'C-A', 'D-A']:
            for key, label in [('score', '玩家平均得分'), ('winningMargin', '冠亞軍差'), ('completions', '每場結案')]:
                r = c['metrics'][key]
                lines.append(f"| {c['comparison']} | {label} | {r['mean']:+.3f} | {r['ci95'][0]:+.3f}～{r['ci95'][1]:+.3f} |")
    lines += ['', '## 政府 5 與進階牌', '', '| 人數 | 組合 | 政府 5 解鎖場次 | 已產生點數使用率 | 進階抽牌 | 進階結案 |', '| --- | --- | ---: | ---: | ---: | ---: |']
    for s in report['summaries']:
        g = s['government5']
        used = percent(g['useRate']) if g['useRate'] is not None else '無預算'
        advanced = sum(v for k, v in s['completionsByDifficulty'].items() if int(k) > 2)
        lines.append(f"| {s['numPlayers']} | {s['scenario']} | {g['gamesUnlocked']:,}/{s['games']:,} | {used} | {s['advancedDraws']} | {advanced} |")
    lines += ['', '## 解讀限制與可重現資料', '',
        '- 所有完成批次的實際每輪行動順序仍固定。更多種子降低隨機發牌／事件的抽樣波動，**不會消除固定順序或單一機器人策略的結構性偏差**。',
        '- 第 3、4 位的配對勝率差與每個座位相對 A 的變化，保存在 analysis.json 的 seatComparisons；不能只依表中名次宣稱最強座位。',
        '- 信賴區間以獨立批次為單位，30／60／100 組分別使用 t(29)／t(59)／t(99)。不把同場玩家當成獨立樣本。',
        '- Balanced 的進階牌偏好仍為 -0.5；此測試不能代表不同策略或真人對進階專案的選擇。',
        '- [完整分析與區間](analysis.json)、[摘要 CSV](summary.csv)、[全部逐場分析資料](games.csv.gz)、[各批版本／種子／原始資料 SHA-256](batch-manifests.json)。',
        '- 每列逐場 CSV 的 batch 和 gameIndex，可重建種子 standard-factorial-batch-{batch}-{players}p-{gameIndex}。原始完整狀態摘要另保存在執行目錄的各 batch-NNN/games.jsonl.gz。',
        '- [勝率圖](seat-win-rates.png)：黑色為累積平均 95% CI，灰色為單批估計的 P05～P95。', '']
    return '\n'.join(lines)


for checkpoint in [30, 60, 100]:
    target = output / str(checkpoint)
    while not all((root / f'batch-{b:03d}' / 'analysis.json').exists() for b in range(1, checkpoint + 1)):
        failures = list(root.glob('batch-*/failure.json'))
        if failures:
            raise RuntimeError(f'Batch failure requires investigation: {failures[0]}')
        time.sleep(5)
    if not (target / 'README.md').exists():
        subprocess.run(['python3', str(webapp / 'scripts/aggregate-standard-seed-batches.py'), str(root),
                        '--first', '1', '--last', str(checkpoint), '--out', str(target)], check=True,
                       stdout=(output / f'{checkpoint}-aggregation.log').open('w'))
        subprocess.run([args.plot_python, str(webapp / 'scripts/plot-standard-experiments.py'), str(target)], check=True)
        report = json.loads((target / 'analysis.json').read_text())
        (target / 'README.md').write_text(generate_text(report, checkpoint))
    completed.append(checkpoint)
    (output / 'README.md').write_text('# 種子批次 1～100：分階段報告\n\n' + '\n'.join(f'- [完成 {c} 組的累積報告（{c * 3600:,} 場）]({c}/README.md)' for c in completed) + '\n')
    print(f'CHECKPOINT {checkpoint} ready: {target / "README.md"}', flush=True)
