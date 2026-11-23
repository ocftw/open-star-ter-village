"""Side-by-side comparison sheets: ours (left) vs Figma / prototype (right). Usage: compose.py SHOT_DIR OUT_DIR"""
import sys
from PIL import Image, ImageDraw
shots, out = sys.argv[1], sys.argv[2]
P = '/workspace/osv-prototype-capture'
F = '/workspace/figma-cache/browser-captures/Page 1'
def sheet(name, ours, ref, ref_label, label, h=900):
    a, b = Image.open(f'{shots}/{ours}').convert('RGB'), Image.open(ref).convert('RGB')
    b = b.resize((int(b.width * h / b.height), h)) if b.height > h else b
    a = a.resize((int(a.width * h / a.height), h)) if a.height > h else a
    im = Image.new('RGB', (a.width + b.width + 30, max(a.height, b.height) + 34), 'white')
    d = ImageDraw.Draw(im)
    d.text((8, 10), f'#492 candidate: {label}', fill='black')
    d.text((a.width + 38, 10), ref_label, fill='black')
    im.paste(a, (0, 34)); im.paste(b, (a.width + 30, 34))
    im.save(f'{out}/{name}')
sheet('compare-default-vs-prototype-02.png', '1280-default.png', f'{P}/02-default-1280.png', 'prototype 02-default-1280', '1280x832 default')
sheet('compare-populated-vs-figma-frame-1.png', '1280-populated.png', f'{F}/main-1-1-1-frame-1.png', 'Figma main-1-1-1-frame-1', '1280x832 populated, overflowing projects, bottom row fully visible')
sheet('compare-selected-vs-prototype-32.png', '1280-selected.png', f'{P}/32-handcard-selected-1280-crop.png', 'prototype 32-handcard-selected-1280-crop', 'selected card in 發起專案')
sheet('compare-keyboard-focus-vs-prototype-90.png', '1280-keyboard-focus.png', f'{P}/90-handcard-keyboard-focus-1280-crop.png', 'prototype 90-handcard-keyboard-focus-1280-crop', 'keyboard focus')
sheet('compare-mobile-vs-prototype-82.png', '390-handle-open.png', f'{P}/82-mobile-390-default.png', 'prototype 82-mobile-390-default (source has no handle)', '390 handle open — PROPOSED composition', h=844)
