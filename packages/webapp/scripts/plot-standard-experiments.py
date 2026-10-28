"""Optional report figures; requires matplotlib, independent of the webapp runtime."""
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import PercentFormatter

root = Path(sys.argv[1])
report = json.loads((root / 'analysis.json').read_text())
colors = ['#266b93', '#e08b27', '#21816f', '#bd4a57']
fig, axes = plt.subplots(3, 1, figsize=(11, 10), layout='constrained')
for ax, count in zip(axes, [2, 3, 4]):
    groups = [s for s in report['summaries'] if s['numPlayers'] == count]
    width = 0.72 / count
    for seat in range(count):
        rates = [g['seats'][seat]['winRate'] for g in groups]
        x = [i + (seat - (count - 1) / 2) * width for i in range(4)]
        ax.bar(x, [r['mean'] for r in rates], width=width * .92, color=colors[seat], label=f'Seat {seat + 1}')
        ax.errorbar(x, [r['mean'] for r in rates], yerr=[r['high'] - r['mean'] for r in rates], fmt='none', ecolor='#242424', capsize=3, linewidth=1)
    ax.axhline(1 / count, linestyle='--', linewidth=1, color='#555555', label='Equal share')
    ax.set_title(f'{count} players — 300 games per option', loc='left', fontweight='bold')
    ax.set_xticks(range(4), ['A: Existing / +2', 'B: New cubes / +2', 'C: Existing / Stars', 'D: New cubes / Stars'])
    ax.set_ylim(0, .8 if count == 2 else .7)
    ax.yaxis.set_major_formatter(PercentFormatter(1))
    ax.set_ylabel('Win share')
    ax.spines[['top', 'right']].set_visible(False)
    ax.grid(axis='y', alpha=.15)
    ax.set_axisbelow(True)
    ax.legend(ncol=count + 1, loc='upper left', frameon=False, fontsize=9)
fig.suptitle('Standard rule options: seat win shares\n3,600 completed games · identical Balanced bots · paired seeds', fontsize=15, fontweight='bold')
fig.supxlabel('Ties split wins. Bars show approximate 95% intervals. Actual turn order stayed fixed each round.', fontsize=10)
fig.savefig(root / 'seat-win-rates.png', dpi=170)
fig.savefig(root / 'seat-win-rates.svg')
