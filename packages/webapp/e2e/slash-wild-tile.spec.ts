/** 斜槓青年 wild tile (#494 / MK-A7, MK-A1): 9px sub-label centred on the tile face, real game. */
import { test, expect } from '@playwright/test';
import { openWildMatch } from './slashWildMatch';

for (const [width, height] of [[1280, 832], [390, 844]] as const) {
  test.describe(`斜槓青年 wild tile at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test('centres the 88px face and its 9px sub-label within the market slot', async ({ page, request }) => {
      await openWildMatch(page, request);
      const tile = page.locator('[data-testid^="job-card-slash-0-"]');
      await tile.scrollIntoViewIfNeeded();
      await expect(tile).toHaveAttribute('data-wild', 'true');
      await expect(page.getByTestId('job-market-count')).toHaveText('JOB MARKET · 8 CARDS');
      await expect(page.getByTestId('job-market-count')).toHaveAttribute('data-count', '8');

      const face = tile.getByTestId(/^job-face-slash-0-/);
      const sub = face.locator('.job-tile-sub');
      await expect(sub).toHaveText('可作為任一人力使用');
      const layout = await tile.evaluate(async (tile) => {
        await document.fonts.ready;
        const face = tile.querySelector('.job-tile-face')!;
        const sub = face.querySelector('.job-tile-sub')!;
        const avatar = face.querySelector('.job-char--wild')!;
        const edges = ({ left, right, width }: DOMRect) => ({ left, right, width });
        const range = document.createRange();
        range.selectNodeContents(sub);
        return {
          fontSize: getComputedStyle(sub).fontSize,
          tile: edges(tile.getBoundingClientRect()),
          face: edges(face.getBoundingClientRect()),
          avatar: edges(avatar.getBoundingClientRect()),
          avatarHeight: avatar.getBoundingClientRect().height,
          slotWidth: tile.parentElement!.getBoundingClientRect().width,
          lines: Array.from(range.getClientRects(), edges),
          overflowX: sub.scrollWidth - sub.clientWidth,
        };
      });
      const gapDifference = (inner: { left: number; right: number }, outer: { left: number; right: number }) =>
        Math.abs((inner.left - outer.left) - (outer.right - inner.right));
      expect(layout.slotWidth).toBe(width === 1280 ? 124 : 96);
      expect(layout.tile.width).toBe(layout.slotWidth);
      expect(Math.abs(layout.face.width - 88)).toBeLessThanOrEqual(0.5);
      expect(gapDifference(layout.face, layout.tile)).toBeLessThanOrEqual(1);
      expect(layout.avatar.width).toBe(44);
      expect(layout.avatarHeight).toBe(44);
      expect(gapDifference(layout.avatar, layout.face)).toBeLessThanOrEqual(1);
      expect(layout.fontSize).toBe('9px');
      expect(layout.lines.length).toBeGreaterThan(0);
      for (const line of layout.lines) {
        expect(gapDifference(line, layout.face)).toBeLessThanOrEqual(1);
        expect(line.left).toBeGreaterThanOrEqual(layout.face.left);
        expect(line.right).toBeLessThanOrEqual(layout.face.right);
      }
      expect(layout.overflowX).toBeLessThanOrEqual(0);
    });
  });
}
