"""Side-by-side sheets: ours (left) vs Figma / prototype / wireframe (right). Usage: compose.py SHOT_DIR OUT_DIR SHA"""
import sys
from PIL import Image, ImageDraw
shots, out, sha = sys.argv[1], sys.argv[2], sys.argv[3]
P = '/workspace/osv-prototype-capture'
F = '/workspace/figma-cache/browser-captures/Page 1'
W = '/workspace/jobs/restyle-batch2/plans/img/497'

def sheet(name, ours, ref, ref_label, label, h=700):
    a, b = Image.open(f'{shots}/{ours}').convert('RGB'), Image.open(ref).convert('RGB')
    b = b.resize((int(b.width * h / b.height), h)) if b.height > h else b
    a = a.resize((int(a.width * h / a.height), h)) if a.height > h else a
    im = Image.new('RGB', (a.width + b.width + 30, max(a.height, b.height) + 34), 'white')
    d = ImageDraw.Draw(im)
    d.text((8, 10), f'#497 candidate {sha[:10]}: {label}', fill='black')
    d.text((a.width + 38, 10), ref_label, fill='black')
    im.paste(a, (0, 34)); im.paste(b, (a.width + 30, 34))
    im.save(f'{out}/{name}')

sheet('compare-idle-vs-figma-36-3382.png', '1280-idle.png', f'{F}/start-project-1-1-1.png', 'Figma 36-3382 (start-project-1-1-1)', '1280 idle')
sheet('compare-enter-vs-figma-36-3845.png', '1280-enter.png', f'{F}/start-project-1-1-2.png', 'Figma 36-3845 (start-project-1-1-2)', '1280 enter START')
sheet('compare-enter-vs-prototype-30.png', '1280-enter.png', f'{P}/30-start-project-mode-1280-crop.png', 'prototype 30 (start-project mode)', '1280 enter START')
sheet('compare-project-first-vs-prototype-32.png', '1280-project-first.png', f'{P}/32-handcard-selected-1280-crop.png', 'prototype 32 (handcard selected)', '1280 project-first')
sheet('compare-unselect-restored-vs-wireframe.png', '1280-unselect-restored.png', f'{W}/state-unselect-project-desktop.png', 'plan wireframe: unselect project (proposed)', '1280 unselect restored')
sheet('compare-job-first-vs-wireframe.png', '1280-job-first.png', f'{W}/state-job-first-desktop.png', 'plan wireframe: job-first (proposed)', '1280 job-first')
sheet('compare-pair-vs-figma-44-135.png', '1280-pair.png', f'{F}/start-project-1-1-3.png', 'Figma 44-135 (start-project-1-1-3)', '1280 pair')
sheet('compare-pair-vs-prototype-36.png', '1280-pair.png', f'{P}/36-start-project-slots-1280-crop.png', 'prototype 36 (start-project slots)', '1280 pair')
sheet('compare-success-vs-prototype-39.png', '1280-success.png', f'{P}/39-project-placed-settled-1280-crop.png', 'prototype 39 (project placed settled)', '1280 success')
sheet('compare-mobile-idle-vs-prototype-82.png', '390-idle.png', f'{P}/82-mobile-390-default.png', 'prototype 82 (mobile default)', '390 idle', h=700)
sheet('compare-mobile-enter-vs-prototype-87.png', '390-enter.png', f'{P}/87-mobile-390-start-project-mode.png', 'prototype 87 (mobile START)', '390 enter START', h=700)
print('composed')
