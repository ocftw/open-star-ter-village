import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Run against the production build served by next start on port 3540.
const output = process.argv[2] ?? new URL('./', import.meta.url).pathname;
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const hand = '[data-testid^="hand-card-"]';
const jobs = '[data-testid^="job-card-"]';

async function dismissRound(page) {
  await page.locator('[data-game-board][data-round-start-ready="true"]').waitFor();
  const overlay = page.getByTestId('round-start-overlay');
  if (await overlay.isVisible()) {
    await overlay.getByRole('button', { name: '知道了', exact: true }).click();
    await overlay.waitFor({ state: 'detached' });
  }
}

async function availableCards(page) {
  const projects = await page.locator(hand).evaluateAll((cards) => cards.map((card) => ({
    id: card.dataset.testid, requirements: card.dataset.requirements.split(','),
  })));
  const market = await page.locator(jobs).evaluateAll((cards) => cards.map((card) => ({
    id: card.dataset.testid, name: card.dataset.jobName,
  })));
  return { projects, market };
}

async function advanceRound(page, round) {
  const perspectives = [/Alice · Player 1/i, /Bob · Player 2/i, /Charlie · Player 3/i];
  for (const name of perspectives) {
    await dismissRound(page);
    await page.getByTestId('dev-tools-open').click();
    await page.getByRole('radio', { name }).check();
    await page.getByTestId('dev-tools-close').click();
    await page.getByTestId('end-turn').click();
    await page.getByTestId('ca-confirm').click();
    if (round === 3 && name === perspectives.at(-1)) {
      const discard = page.getByTestId('discard-job-cards-panel');
      await discard.waitFor();
      for (let i = 0; i < 2; i++) await page.locator('[data-testid^="job-remove-"]').first().click();
      await page.getByTestId('discard-confirm').click();
    }
  }
}

try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 832 } });
    const visit = async () => {
      await page.goto('http://localhost:3540/dev?seed=e2e-2');
      await dismissRound(page);
      await page.getByTestId('action-createProject').waitFor();
      await page.evaluate(() => document.fonts.ready);
    };
    const capture = async (state) => {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: `${output}/${width}-${state}.png`, animations: 'disabled', fullPage: width === 390 });
    };
    await visit();
    if (width === 390) await page.getByTestId('mobile-sheet-handle').click();
    await capture('idle');
    const { projects, market } = await availableCards(page);
    const pair = projects.flatMap((project) => market
      .filter((job) => project.requirements.includes(job.name) &&
        projects.some((card) => !card.requirements.includes(job.name)))
      .map((job) => ({ project, job })))[0];
    if (!pair) throw new Error('Seed has no matching pair that demonstrates both filters.');
    const start = page.getByTestId('action-createProject');
    await start.click();
    await capture('enter');
    await page.getByTestId(pair.project.id).click();
    await capture('project-first');
    await page.getByTestId('start-clear-project').click();
    await capture('unselect-restored');
    await page.getByTestId(pair.job.id).click();
    await capture('job-first');
    await page.getByTestId(pair.project.id).click();
    await capture('pair');
    await page.getByTestId('ca-confirm').click();
    await page.locator('[data-testid="projects-yours"] [data-start-placed]').waitFor();
    await capture('success');
    await page.close();

    const slashPage = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 832 } });
    await slashPage.goto('http://localhost:3540/dev?seed=e2e-2');
    for (const round of [1, 2, 3]) await advanceRound(slashPage, round);
    await dismissRound(slashPage);
    await slashPage.getByTestId('dev-tools-open').click();
    await slashPage.getByRole('radio', { name: /Alice · Player 1/i }).check();
    await slashPage.getByTestId('dev-tools-close').click();
    await slashPage.getByTestId('action-createProject').click();
    // The natural three-player seed produces this legal pair in round four.
    await slashPage.getByTestId('hand-card-d15rtg').click();
    await slashPage.getByTestId('job-card-cehihv').click();
    const picker = slashPage.getByTestId('start-slash-picker');
    await picker.waitFor();
    await slashPage.screenshot({ path: `${output}/${width}-slash-picker.png`, animations: 'disabled' });
    await picker.getByRole('button', { name: '工程師' }).click();
    await slashPage.getByTestId('start-assign').scrollIntoViewIfNeeded();
    await slashPage.screenshot({ path: `${output}/${width}-slash-assigned.png`, animations: 'disabled' });
    await slashPage.close();
  }
} finally {
  await browser.close();
}
