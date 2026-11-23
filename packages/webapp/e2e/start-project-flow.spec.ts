import { test, expect, type Locator } from '@playwright/test';
import { dismissRoundStartOverlay } from './devTools';

const handSelector = '[data-testid^="hand-card-"]';
const marketSelector = '[data-testid^="job-card-"]';
const ids = (row: Locator) => row.evaluateAll((cards) => cards.map((card) => card.getAttribute('data-testid')));
const stableFirst = <T>(cards: T[], eligible: (card: T) => boolean) =>
  [...cards.filter(eligible), ...cards.filter((card) => !eligible(card))];

for (const width of [1280, 390]) {
  test.describe(`START at ${width}`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 832 } });

    test('reorders both ways, restores current rows and commits a single real pair', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/dev?seed=e2e-2');
      await dismissRoundStartOverlay(page);
      const hand = page.getByTestId('hand-panel');
      const market = page.getByTestId('job-market');
      const handCards = hand.locator(handSelector);
      const jobCards = market.locator(marketSelector);
      const projects = await handCards.evaluateAll((cards) => cards.map((card) => ({
        id: card.getAttribute('data-testid')!,
        requirements: card.getAttribute('data-requirements')!.split(','),
      })));
      const jobs = await jobCards.evaluateAll((cards) => cards.map((card) => ({
        id: card.getAttribute('data-testid')!,
        name: card.getAttribute('data-job-name')!,
      })));
      const baseHand = projects.map(({ id }) => id);
      const baseMarket = jobs.map(({ id }) => id);
      expect(baseHand.length).toBeGreaterThan(1);
      expect(baseMarket.length).toBeGreaterThan(1);
      const pair = projects.flatMap((project) => jobs
        .filter((job) => project.requirements.includes(job.name) &&
          projects.some((card) => !card.requirements.includes(job.name)) &&
          jobs.some((card) => !project.requirements.includes(card.name)))
        .map((job) => ({ project, job })))[0];
      expect(pair).toBeDefined();
      const { project, job } = pair;
      const filteredHand = stableFirst(projects, (card) => card.requirements.includes(job.name)).map(({ id }) => id);
      const filteredMarket = stableFirst(jobs, (card) => project.requirements.includes(card.name)).map(({ id }) => id);
      const checkRows = async (expectedHand: string[], expectedMarket: string[]) => {
        expect(await ids(handCards)).toEqual(expectedHand);
        expect(await ids(jobCards)).toEqual(expectedMarket);
        await expect(page.locator(handSelector)).toHaveCount(expectedHand.length);
        await expect(page.locator(marketSelector)).toHaveCount(expectedMarket.length);
      };
      const start = page.getByTestId('action-createProject');
      const host = page.getByTestId('start-project-flow');
      const confirm = page.getByTestId('ca-confirm');
      await start.click();
      await expect(page.getByTestId('start-project-heading')).toBeFocused();
      await expect(host).toContainText('COST 2');
      await expect(host.locator('dialog[open]')).toHaveCount(0);
      await expect(confirm).toBeDisabled();
      await expect(page.getByTestId('projects-section')).toHaveAttribute('inert', '');
      await checkRows(baseHand, baseMarket);
      const assertDesktopFit = async () => {
        if (width !== 1280) return;
        const hostBox = (await host.boundingBox())!;
        const bottom = (await page.getByTestId('board-bottom-row').boundingBox())!;
        expect(hostBox.y + hostBox.height).toBeLessThanOrEqual(bottom.y + 1);
        expect(bottom.y + bottom.height).toBeLessThanOrEqual(832);
        for (const rail of [hand, market]) {
          const box = (await rail.boundingBox())!;
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.y + box.height).toBeLessThanOrEqual(832);
        }
      };
      if (width === 390) {
        await expect(host.getByTestId('hand-panel')).toHaveCount(1);
        await expect(host.getByTestId('job-market')).toHaveCount(1);
        await expect(page.getByTestId('hand-panel')).toHaveCount(1);
        await expect(page.getByTestId('job-market')).toHaveCount(1);
        expect(await host.evaluate((section) => Array.from(section.querySelectorAll(
          '[data-testid="start-project-slots"], [data-testid="hand-panel"], [data-testid="job-market"], [data-testid="start-project-actions"]',
        ), (el) => el.getAttribute('data-testid')))).toEqual(['start-project-slots', 'hand-panel', 'job-market', 'start-project-actions']);
      } else {
        await assertDesktopFit();
      }
      for (const rail of [hand, market]) {
        for (let tab = 0; tab < 24 && !(await rail.evaluate((el) => el.contains(document.activeElement))); tab++) {
          await page.keyboard.press('Tab');
        }
        expect(await rail.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      }

      await page.getByTestId(project.id).click();
      await checkRows(baseHand, filteredMarket);
      const disabledJob = market.locator('[data-visual-state="disabled"]').first();
      await expect(disabledJob).toBeDisabled();
      await disabledJob.dispatchEvent('click');
      await expect(host.getByTestId('start-clear-job')).toHaveCount(0);
      expect(await market.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);

      await page.getByTestId(job.id).click();
      await expect(confirm).toBeEnabled();
      await assertDesktopFit();
      await checkRows(filteredHand, filteredMarket);
      await host.getByTestId('start-clear-project').click();
      await checkRows(filteredHand, baseMarket);
      await expect(confirm).toBeDisabled();
      await host.getByTestId('start-clear-job').click();
      await checkRows(baseHand, baseMarket);

      await page.getByTestId(job.id).click();
      await checkRows(filteredHand, baseMarket);
      const disabledProject = hand.locator('[data-visual-state="disabled"]').first();
      await expect(disabledProject).toHaveAttribute('aria-disabled', 'true');
      await disabledProject.dispatchEvent('click');
      await disabledProject.dispatchEvent('keydown', { key: 'Enter' });
      await expect(host.getByTestId('start-clear-project')).toHaveCount(0);
      expect(await hand.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);

      await page.getByTestId(project.id).click();
      await checkRows(filteredHand, filteredMarket);
      await host.getByTestId('start-clear-job').click();
      await checkRows(baseHand, filteredMarket);
      await expect(confirm).toBeDisabled();
      await host.getByTestId('start-clear-project').click();
      await checkRows(baseHand, baseMarket);

      await page.getByTestId(job.id).click();
      await page.keyboard.press('Escape');
      await expect(host).toHaveCount(0);
      await expect(start).toBeFocused();
      await checkRows(baseHand, baseMarket);
      if (width === 390) {
        await expect(page.getByTestId('mobile-sheet').getByTestId('hand-panel')).toBeHidden();
        await expect(page.getByTestId('mobile-sheet').getByTestId('job-market')).toHaveCount(0);
      }

      await start.click();
      await page.getByTestId(project.id).click();
      await page.getByTestId(job.id).click();
      await expect(confirm).toHaveCount(1);
      await confirm.click();
      await expect(host).toHaveCount(0);
      await expect(page.getByTestId('projects-yours').locator('[data-start-placed]')).toHaveCount(1);
      expect(await ids(handCards)).toEqual(baseHand.filter((id) => id !== project.id));
      const afterMarket = await ids(jobCards);
      expect(afterMarket).not.toContain(job.id);
      expect(afterMarket.filter((id) => baseMarket.includes(id!))).toEqual(baseMarket.filter((id) => id !== job.id));
      expect(afterMarket).toHaveLength(baseMarket.length);
      await expect(page.getByTestId('ranking-row-Alice')).toHaveAttribute('data-actions', '2');
      await expect(page.getByTestId('ranking-row-Alice')).toHaveAttribute('data-score', '2');
    });
  });
}
