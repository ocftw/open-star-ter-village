"""Side-by-side sheets: ours (left) vs Figma / prototype / wireframe (right). Usage: compose.py SHOT_DIR OUT_DIR SHA"""
import sys
from PIL import Image, ImageDraw
shots, out, sha = sys.argv[1], sys.argv[2], sys.argv[3]
P = '/workspace/osv-prototype-capture'
F = '/workspace/figma-cache/browser-captures/Page 1'
W = '/workspace/jobs/restyle-batch2/plans/img/496'
def sheet(name, ours, ref, ref_label, label, h=700):
    a, b = Image.open(f'{shots}/{ours}').convert('RGB'), Image.open(ref).convert('RGB')
    b = b.resize((int(b.width * h / b.height), h)) if b.height > h else b
    a = a.resize((int(a.width * h / a.height), h)) if a.height > h else a
    im = Image.new('RGB', (a.width + b.width + 30, max(a.height, b.height) + 34), 'white')
    d = ImageDraw.Draw(im)
    d.text((8, 10), f'#496 candidate {sha[:10]}: {label}', fill='black')
    d.text((a.width + 38, 10), ref_label, fill='black')
    im.paste(a, (0, 34)); im.paste(b, (a.width + 30, 34))
    im.save(f'{out}/{name}')
sheet('compare-idle-vs-figma-36-994.png', '1280-market-1-idle.png', f'{F}/refill-1-1-1.png', 'Figma 36-994 (refill-1-1-1)', '1280 idle')
sheet('compare-entered-vs-prototype-10.png', '1280-market-2-entered.png', f'{P}/10-remove-job-mode-enter-1280-crop.png', 'prototype 10-remove-job-mode-enter', '1280 entered')
sheet('compare-entered-vs-figma-36-1445.png', '1280-market-2-entered.png', f'{F}/refill-1-1-2.png', 'Figma 36-1445 (refill-1-1-2)', '1280 entered')
sheet('compare-first-ghost-vs-prototype-13.png', '1280-market-3-first-ghost.png', f'{P}/13-remove-job-after-remove-1-via-keyboard-1280-crop.png', 'prototype 13 (first ghost)', '1280 first ghost')
sheet('compare-cancel-vs-prototype-15.png', '1280-market-4-cancel.png', f'{P}/15-remove-job-after-cancel-1280-crop.png', 'prototype 15 (cancel)', '1280 cancel')
sheet('compare-confirm-empty-slots-vs-wireframe.png', '1280-market-5-confirm-empty-slots.png', f'{W}/state-accepted-desktop.png', 'plan wireframe: accepted (proposed)', '1280 confirm: empty slots')
sheet('compare-deal-vs-wireframe.png', '1280-market-6-deal-mid-frame.png', f'{W}/state-deal-1-desktop.png', 'plan wireframe: deal step 1 (proposed)', '1280 deal mid-frame')
sheet('compare-success-vs-figma-36-2919.png', '1280-market-7-success.png', f'{F}/refill-1-1-4.png', 'Figma 36-2919 (refill-1-1-4)', '1280 success')
sheet('compare-mobile-entered-vs-prototype-84.png', '390-market-2-entered.png', f'{P}/84-mobile-390-remove-job-mode-crop.png', 'prototype 84 (mobile remove mode)', '390 entered', h=700)
sheet('compare-mobile-ghost-vs-prototype-85.png', '390-market-3-first-ghost.png', f'{P}/85-mobile-390-remove-job-after-1-crop.png', 'prototype 85 (mobile after 1)', '390 first ghost', h=700)
