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
    d.text((8, 10), f'#494 candidate: {label}', fill='black')
    d.text((a.width + 38, 10), ref_label, fill='black')
    im.paste(a, (0, 34)); im.paste(b, (a.width + 30, 34))
    im.save(f'{out}/{name}')
sheet('compare-start-vs-prototype-02.png', '1280-market-start.png', f'{P}/02-default-1280-crop.png', 'prototype 02-default-1280-crop', '1280 market at start')
sheet('compare-start-vs-figma-frame-1.png', '1280-start.png', f'{F}/main-1-1-1-frame-1.png', 'Figma main-1-1-1-frame-1', '1280x832 start')
sheet('compare-start-vs-figma-frame-2.png', '1280-start.png', f'{F}/main-1-1-1-frame-2.png', 'Figma main-1-1-1-frame-2 (badge annotation)', '1280x832 start')
sheet('compare-paged-vs-prototype-14.png', '1280-market-paged.png', f'{P}/14-remove-job-after-remove-2-click-1280-crop.png', 'prototype 14-remove-job-after-remove-2-click-1280-crop', '1280 market paged to the middle')
sheet('compare-mobile-vs-prototype-83.png', '390-market.png', f'{P}/83-mobile-390-scrolled-market.png', 'prototype 83-mobile-390-scrolled-market', '390 market', h=844)
