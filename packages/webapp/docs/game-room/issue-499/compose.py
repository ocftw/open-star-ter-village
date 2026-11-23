"""Side-by-side sheets: ours (left) vs Figma / prototype / wireframe (right). Usage: compose.py SHOT_DIR OUT_DIR SHA"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

shots, out, sha = sys.argv[1], sys.argv[2], sys.argv[3]
P = "/workspace/osv-prototype-capture"
F = "/workspace/figma-cache/browser-captures/Page 1"
W = "/workspace/jobs/restyle-batch2/plans/img/499"


def sheet(name, ours, ref, ref_label, label, h=700):
    a, b = Image.open(f"{shots}/{ours}").convert("RGB"), Image.open(ref).convert("RGB")
    b = b.resize((int(b.width * h / b.height), h)) if b.height > h else b
    a = a.resize((int(a.width * h / a.height), h)) if a.height > h else a
    im = Image.new("RGB", (a.width + b.width + 30, max(a.height, b.height) + 34), "white")
    d = ImageDraw.Draw(im)
    d.text((8, 10), f"#499 candidate {sha[:10]}: {label}", fill="black")
    d.text((a.width + 38, 10), ref_label, fill="black")
    im.paste(a, (0, 34))
    im.paste(b, (a.width + 30, 34))
    Path(out).mkdir(parents=True, exist_ok=True)
    im.save(f"{out}/{name}")


sheet(
    "compare-active-zero-vs-figma-51-518.png",
    "1280-active-zero.png",
    f"{F}/contribute-project-1-1-2.png",
    "Figma 51-518 (contribute-project-1-1-2)",
    "1280 active-zero",
)
sheet(
    "compare-active-zero-vs-prototype-41.png",
    "1280-active-zero.png",
    f"{P}/41-contribute-own-mode-1280-crop.png",
    "prototype 41 (contribute own mode)",
    "1280 active-zero",
)
sheet(
    "compare-active-zero-vs-wireframe.png",
    "1280-active-zero.png",
    f"{W}/state-active-zero-desktop.png",
    "plan wireframe: active-zero (proposed)",
    "1280 active-zero",
)
sheet(
    "compare-pending-vs-figma-63-32.png",
    "1280-pending.png",
    f"{F}/contribute-project-1-1-3.png",
    "Figma 63-32 (contribute-project-1-1-3)",
    "1280 pending",
)
sheet(
    "compare-pending-vs-prototype-43.png",
    "1280-pending.png",
    f"{P}/43-contribute-plus-clicked-1280-crop.png",
    "prototype 43 (plus clicked)",
    "1280 pending",
)
sheet(
    "compare-pending-vs-prototype-43b.png",
    "1280-pending.png",
    f"{P}/43b-contrib-bar-1280-crop.png",
    "prototype 43b (contrib bar)",
    "1280 pending",
)
sheet(
    "compare-pending-vs-prototype-46.png",
    "1280-pending.png",
    f"{P}/46-contribute-before-confirm-1280-crop.png",
    "prototype 46 (before confirm)",
    "1280 pending",
)
sheet(
    "compare-cancelled-vs-prototype-45.png",
    "1280-cancelled.png",
    f"{P}/45-contribute-cancel-1280-crop.png",
    "prototype 45 (cancel pending)",
    "1280 cancelled",
)
sheet(
    "compare-cancelled-vs-prototype-44.png",
    "1280-cancelled.png",
    f"{P}/44-contribute-minus-back-to-zero-1280-crop.png",
    "prototype 44 (minus back to zero)",
    "1280 cancelled",
)
sheet(
    "compare-row-cap-visible-vs-figma-63-32.png",
    "1280-row-cap-visible.png",
    f"{F}/contribute-project-1-1-3.png",
    "Figma 63-32 (contribute-project-1-1-3, cap notice)",
    "1280 row-cap-visible",
)
sheet(
    "compare-action-cap-visible-vs-wireframe.png",
    "1280-action-cap-visible.png",
    f"{W}/state-cap-desktop.png",
    "plan wireframe: cap notice (proposed)",
    "1280 action-cap-visible",
)
sheet(
    "compare-action-cap-visible-vs-figma-63-32.png",
    "1280-action-cap-visible.png",
    f"{F}/contribute-project-1-1-3.png",
    "Figma 63-32 notice (contribute-project-1-1-3)",
    "1280 action-cap-visible",
)
sheet(
    "compare-confirmed-vs-prototype-47.png",
    "1280-confirmed.png",
    f"{P}/47-contribute-confirming-1280-crop.png",
    "prototype 47 (confirming)",
    "1280 confirmed",
)
sheet(
    "compare-confirmed-vs-prototype-48.png",
    "1280-confirmed.png",
    f"{P}/48-contribute-after-1280-crop.png",
    "prototype 48 (after confirm)",
    "1280 confirmed",
)
sheet(
    "compare-joined-pending-vs-owned-pending.png",
    "1280-joined-pending.png",
    f"{shots}/1280-pending.png",
    "owned pending (visual reference; joined is unprototyped)",
    "1280 joined-pending",
)
sheet(
    "compare-joined-confirmed-vs-owned-confirmed.png",
    "1280-joined-confirmed.png",
    f"{shots}/1280-confirmed.png",
    "owned confirmed (visual reference; joined is unprototyped)",
    "1280 joined-confirmed",
)
sheet(
    "compare-mobile-pending-vs-wireframe.png",
    "390-pending.png",
    f"{W}/state-pending-mobile.png",
    "plan wireframe: mobile pending (proposed)",
    "390 pending (proposed)",
    h=700,
)
sheet(
    "compare-mobile-pending-vs-prototype-87.png",
    "390-pending.png",
    f"{P}/87-mobile-390-start-project-mode.png",
    "prototype 87 (mobile shell only; contribute unprototyped)",
    "390 pending (proposed)",
    h=700,
)
sheet(
    "compare-mobile-active-zero-vs-prototype-84.png",
    "390-active-zero.png",
    f"{P}/84-mobile-390-remove-job-mode-crop.png",
    "prototype 84 (mobile shell only; contribute unprototyped)",
    "390 active-zero (proposed)",
    h=700,
)

print("composed")
