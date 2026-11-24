/** 斜槓青年 wild tile (#494 / MK-A7, MK-A1): 9px sub-label centred on the tile face, real game. */
import { test, expect, type Page } from '@playwright/test';
import { dismissRoundStartOverlay } from './devTools';

const GS = `http://localhost:${process.env.PLAYWRIGHT_GAME_SERVER_PORT ?? '3001'}`;
const GAME = 'OpenStarTerVillage';

async function api(request: import('@playwright/test').APIRequestContext, route: string, data: unknown) {
  const res = await request.post(`${GS}/games/${GAME}${route}`, { data });
  expect(res.ok(), `${route}: ${res.status()}`).toBeTruthy();
  return res.json();
}

/** Real 2-player match whose first event is 斜槓青年; returns Alice (entitled, current player) seat. */
async function createWildMatch(request: import('@playwright/test').APIRequestContext) {
  const { matchID } = await api(request, '/create', {
    numPlayers: 2,
    setupData: { forcedFirstEvent: 'ignore_first_worker_requirement' },
  });
  const joined = await api(request, `/${matchID}/join`, { playerID: '0', playerName: 'Alice', data: { displayName: 'Alice' } });
  await api(request, `/${matchID}/join`, { playerID: '1', playerName: 'Bob', data: { displayName: 'Bob' } });
  await api(request, `/${matchID}/update`, {
    playerID: '0', credentials: joined.playerCredentials, data: { started: true, displayName: 'Alice' },
  });
  return { matchID, playerID: '0', credential: joined.playerCredentials, playerName: 'Alice' };
}

async function openAlice(page: Page, seat: Awaited<ReturnType<typeof createWildMatch>>) {
  await page.addInitScript((s) => {
    localStorage.setItem(`open-star-ter-village.match-credentials.${s.matchID}`, JSON.stringify(s));
    localStorage.setItem('open-star-ter-village.player-name', s.playerName);
  }, seat);
  await page.goto(`/game/${seat.matchID}`);
  await dismissRoundStartOverlay(page);
}

for (const [width, height] of [[1280, 832], [390, 844]] as const) {
  test.describe(`斜槓青年 wild tile at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test('sub-label is 9px and centred on the tile; market still counts 8 real cards', async ({ page, request }) => {
      await openAlice(page, await createWildMatch(request));
      const tile = page.locator('[data-testid^="job-card-slash-0-"]');
      await tile.scrollIntoViewIfNeeded();
      await expect(tile).toHaveAttribute('data-wild', 'true');
      await expect(page.getByTestId('job-market-count')).toHaveText('JOB MARKET · 8 CARDS');
      await expect(page.getByTestId('job-market-count')).toHaveAttribute('data-count', '8');

      const sub = tile.locator('.job-tile-sub');
      await expect(sub).toHaveText('可作為任一人力使用');
      const m = await tile.evaluate((el) => {
        const sub = el.querySelector('.job-tile-sub') as HTMLElement;
        const t = el.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(sub);
        const lines = Array.from(range.getClientRects()).map((r) => ({ left: r.left, right: r.right }));
        return {
          fontSize: getComputedStyle(sub).fontSize,
          tile: { left: t.left, right: t.right, width: t.width },
          lines,
          overflowX: sub.scrollWidth - sub.clientWidth,
        };
      });
      expect(m.fontSize).toBe('9px');
      expect(m.lines.length).toBeGreaterThan(0);
      for (const l of m.lines) {
        // |left gap − right gap| ≤ 1px relative to the tile face
        expect(Math.abs((l.left - m.tile.left) - (m.tile.right - l.right))).toBeLessThanOrEqual(1);
        expect(l.left).toBeGreaterThanOrEqual(m.tile.left);
        expect(l.right).toBeLessThanOrEqual(m.tile.right);
      }
      expect(m.overflowX).toBeLessThanOrEqual(0);
      // slot width is unchanged
      const slot = await tile.locator('xpath=..').evaluate((e) => e.getBoundingClientRect().width);
      expect(Math.round(slot)).toBe(width === 1280 ? 124 : 96);
    });
  });
}
