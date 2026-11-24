"""Side-by-side comparison sheets: ours (left) vs prototype / Figma (right). Usage: compose.py SHOT_DIR OUT_DIR"""
import sys
from PIL import Image, ImageDraw
shots, out = sys.argv[1], sys.argv[2]
P = '/workspace/osv-prototype-capture'
F = '/workspace/figma-cache/browser-captures/Page 1'
def sheet(name, ours, ref, ref_label, h=900):
    a, b = Image.open(f'{shots}/{ours}').convert('RGB'), Image.open(ref).convert('RGB')
    b = b.resize((int(b.width * h / b.height), h)) if b.height > h else b
    a = a.resize((int(a.width * h / a.height), h)) if a.height > h else a
    w = a.width + b.width + 30
    im = Image.new('RGB', (w, max(a.height, b.height) + 34), 'white')
    d = ImageDraw.Draw(im)
    d.text((8, 10), f'#490 candidate ({ours})', fill='black')
    d.text((a.width + 38, 10), ref_label, fill='black')
    im.paste(a, (0, 34)); im.paste(b, (a.width + 30, 34))
    im.save(f'{out}/{name}')
sheet('compare-start-vs-prototype-02.png', '1280-start.png', f'{P}/02-default-1280.png', 'prototype 02-default-1280')
sheet('compare-both-vs-figma-frame-1.png', '1280-both.png', f'{F}/main-1-1-1-frame-1.png', 'Figma main-1-1-1-frame-1')
sheet('compare-both-vs-figma-frame-2.png', '1280-both.png', f'{F}/main-1-1-1-frame-2.png', 'Figma main-1-1-1-frame-2 (annotation 53:1551)')
sheet('compare-mobile-vs-prototype-82.png', '390-projects.png', f'{P}/82-mobile-390-default.png', 'prototype 82-mobile-390-default', h=844)
