import { expect, test } from '@playwright/test';

const VIEWPORTS = [375, 390, 1280] as const;
const TOLERANCE = 0.5;

// IconButton is not mounted on a user-facing screen yet, so reproduce the
// squeeze by injecting a cramped single-line flex row into an existing route
// that already loads globals.css: eight buttons plus labels cannot fit 375px.
for (const width of VIEWPORTS) {
  test(`IconButton stays a 44x44 circle at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.evaluate(() => {
      const row = document.createElement('div');
      row.id = 'icon-btn-fixture';
      row.style.cssText = 'position:absolute;top:0;left:0;width:100%;display:flex;flex-wrap:nowrap;gap:8px;align-items:center;background:#fff;z-index:9999';
      const add = (el: HTMLElement) => row.appendChild(el);
      for (const label of ['Default:', 'Hover:']) {
        const span = document.createElement('span');
        span.textContent = label;
        add(span);
        for (let i = 0; i < 4; i++) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'gr-icon-btn';
          b.setAttribute('aria-label', `${label}${i}`);
          add(b);
        }
      }
      const toast = document.createElement('div');
      toast.className = 'gr-toast';
      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'gr-icon-btn gr-toast__dismiss';
      toast.appendChild(dismiss);
      row.appendChild(toast);
      document.body.appendChild(row);
    });

    const boxes = await page.locator('#icon-btn-fixture .gr-icon-btn:not(.gr-toast__dismiss)').evaluateAll(
      (els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height })),
    );
    expect(boxes).toHaveLength(8);
    for (const { w, h } of boxes) {
      expect(Math.abs(w - h)).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(w - 44)).toBeLessThanOrEqual(TOLERANCE);
      expect(Math.abs(h - 44)).toBeLessThanOrEqual(TOLERANCE);
    }

    // Toast dismiss is intentionally smaller but must stay circular.
    const dismiss = await page.locator('#icon-btn-fixture .gr-toast__dismiss').boundingBox();
    expect(Math.abs(dismiss!.width - dismiss!.height)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(dismiss!.width - 24)).toBeLessThanOrEqual(TOLERANCE);
  });
}
