import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { confirmButton, dismissRoundStartOverlay, selectDevPerspective, type DevPerspective } from './devTools';

const setups = [
  ['player1', '37hg6q', '6tgd3p'],  // Round 1: Alice starts 國民法官 with 公務人員.
  ['player2', 'edfu208', 'jv6e37o'], // Bob starts 公共政策網路參與平台 with 議題工作者.
  ['player3', 'i4pkf88', 'qm86c4o'], // Charlie starts 掃了再買 with 議題工作者.
  ['player1', '2ps857', 's2ujq4'],   // Round 2: Alice starts LibreOffice with 工程師.
  ['player2', '2nqaroo', '68ec69g'], // Bob starts 資料申請小幫手 with 美術設計.
  ['player3', 'ilrt64', 'b4d7a5'],   // Charlie starts 國家寶藏 with 文字工作者.
] as const satisfies readonly (readonly [DevPerspective, string, string])[];

const panel = (page: Page) => page.getByTestId('context-action');
const bar = (page: Page) => page.getByTestId('contribution-confirm-bar');
const cap = (page: Page) => page.getByTestId('contribution-cap-notice');
const project = (page: Page, index: number) => page.getByTestId(`project-slot-${index}`);

async function prepareBoard(page: Page) {
  await page.goto('/dev?seed=e2e-2');
  for (let index = 0; index < setups.length; index++) {
    const [perspective, handId, jobId] = setups[index];
    await dismissRoundStartOverlay(page);
    await selectDevPerspective(page, perspective);
    await dismissRoundStartOverlay(page);
    await expect(panel(page)).toHaveAttribute('data-mode', 'idle');
    await page.getByTestId('action-createProject').click();
    await page.getByTestId(`hand-card-${handId}`).click();
    await page.getByTestId(`job-card-${jobId}`).click();
    await confirmButton(page).click();
    await expect(project(page, index)).toBeVisible();
    await page.getByTestId('end-turn').click();
    await confirmButton(page).click();
    await expect(panel(page)).toHaveCount(0);
  }
  await dismissRoundStartOverlay(page);
  await selectDevPerspective(page, 'player1');
  await dismissRoundStartOverlay(page);
  await expect(panel(page)).toHaveAttribute('data-mode', 'idle');
  await expect(page.getByTestId('ap-dots')).toHaveAttribute('data-ap', '4');
}

async function expectBudget(page: Page, total: number, max: number) {
  await expect(bar(page)).toHaveCount(1);
  await expect(bar(page).getByText(`貢獻 +${total}`, { exact: true })).toBeVisible();
  await expect(bar(page).getByText(`最多 +${max}`, { exact: true })).toBeVisible();
  await expect(bar(page).getByText(`剩餘 ${max - total}`, { exact: true })).toBeVisible();
  await expect(confirmButton(page)).toHaveCount(1);
}

async function verifyLastRowClearsBar(page: Page, mobile: boolean) {
  const projects = page.getByTestId('projects-section');
  const last = project(page, 5).locator('.project-card__progress-row').last();
  const barTop = () => bar(page).evaluate((element) => element.getBoundingClientRect().top);
  if (mobile) {
    await expect(page.getByTestId('projects-section')).toHaveCSS('overflow-y', 'visible');
    const before = await page.evaluate(() => window.scrollY);
    await last.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
  } else {
    await expect(bar(page)).toHaveCSS('transform', 'none');
    await expect.poll(async () => {
      const box = await bar(page).boundingBox();
      const padding = await projects.evaluate((element) => parseFloat(getComputedStyle(element).paddingBottom));
      return !!box && padding >= box.height;
    }).toBe(true);
    await projects.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect.poll(() => projects.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const [stage, strip, bottom] = await Promise.all([
      page.getByTestId('contribution-stage').boundingBox(),
      bar(page).boundingBox(),
      page.getByTestId('board-bottom-row').boundingBox(),
    ]);
    expect(stage && strip && bottom).toBeTruthy();
    expect(strip!.x).toBeGreaterThanOrEqual(stage!.x);
    expect(strip!.x + strip!.width).toBeLessThanOrEqual(stage!.x + stage!.width);
    expect(strip!.y).toBeGreaterThanOrEqual(stage!.y);
    expect(strip!.y + strip!.height).toBeLessThanOrEqual(stage!.y + stage!.height);
    expect(strip!.y + strip!.height).toBeLessThan(bottom!.y);
    expect(bottom!.y + bottom!.height).toBeLessThanOrEqual(832);
  }
  await expect(last).toBeInViewport({ ratio: 1 });
  await expect.poll(async () => {
    const rowBottom = await last.evaluate((element) => element.getBoundingClientRect().bottom);
    return rowBottom <= await barTop();
  }).toBe(true);
  if (!mobile) await projects.evaluate((element) => { element.scrollTop = 0; });
}

for (const width of [1280, 390]) {
  test(`owned and joined contributions, cap transitions and board geometry at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    const mobile = width === 390;
    await page.setViewportSize({ width, height: mobile ? 844 : 832 });
    if (mobile) await page.emulateMedia({ reducedMotion: 'reduce' });
    const output = process.env.ISSUE_499_SCREENSHOTS;
    const capture = async (name: string) => {
      if (!output) return;
      if (await bar(page).count()) {
        if (mobile) await expect(bar(page)).toHaveCSS('animation-name', 'none');
        else await expect(bar(page)).toHaveCSS('transform', 'none');
      }
      await mkdir(output, { recursive: true });
      await page.screenshot({ path: join(output, `${width}-${name}.png`), fullPage: mobile });
    };
    await prepareBoard(page);
    const faded = page.locator('[data-contribution-faded]');
    await expect(faded).toHaveCount(0);

    await page.getByTestId('action-contributeOwnedProjects').click();
    const plusLow = project(page, 0).getByTestId('contribution-increment');
    const minusLow = project(page, 0).getByTestId('contribution-decrement');
    const plusHigh = project(page, 3).getByTestId('contribution-increment');
    await expect(page.getByTestId('projects-yours').getByTestId('contribution-increment')).toHaveCount(2);
    await expect(page.getByTestId('projects-others').getByTestId('contribution-increment')).toHaveCount(0);
    await expect(faded).toHaveCount(4);
    await expect(project(page, 0)).toHaveCSS('opacity', '1');
    await expect(project(page, 1)).toHaveCSS('opacity', '0.7');
    await expect(minusLow).toBeDisabled();
    await project(page, 0).getByRole('heading', { name: '國民法官' }).click();
    await expect(panel(page)).toHaveAttribute('data-mode', 'contributeOwnedProjects');
    await expect(bar(page)).toHaveCount(0);
    await capture('active-zero');

    if (mobile) {
      await plusLow.click();
    } else {
      await plusLow.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(plusLow).toBeFocused();
      await expect(plusLow).toHaveCSS('outline-style', 'solid');
      await page.keyboard.press('Enter');
    }
    await expectBudget(page, 1, 4);
    if (mobile) {
      await expect(bar(page)).toHaveCSS('animation-name', 'none');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    await capture('pending');
    await minusLow.click();
    await expect(bar(page)).toHaveCount(0);
    await plusLow.click();
    await page.getByTestId('contribution-cancel-pending').click();
    await expect(bar(page)).toHaveCount(0);
    await expect(plusLow).toBeEnabled();
    await expect(panel(page)).toHaveAttribute('data-mode', 'contributeOwnedProjects');
    await expect(page.getByTestId('ap-dots')).toHaveAttribute('data-ap', '4');
    await capture('cancelled');

    await plusLow.click();
    await verifyLastRowClearsBar(page, mobile);
    await plusLow.click();
    await expectBudget(page, 2, 4);
    await expect(plusLow).toBeDisabled();
    await expect(plusHigh).toBeEnabled();
    await expect(cap(page)).toHaveText('已達到貢獻值上限');
    await capture('row-cap-visible');
    await expect(cap(page)).toHaveCount(0, { timeout: 3_000 });
    await capture('row-cap-expired');
    await minusLow.click();
    await plusLow.click();
    await expect(cap(page)).toBeVisible();

    await plusHigh.click();
    await plusHigh.click();
    await expectBudget(page, 4, 4);
    await expect(plusHigh).toBeDisabled();
    await expect(cap(page)).toBeVisible();
    await capture('action-cap-visible');
    await expect(cap(page)).toHaveCount(0, { timeout: 3_000 });
    await capture('action-cap-expired');
    await page.getByTestId('ca-cancel').click();
    await expect(panel(page)).toHaveAttribute('data-mode', 'idle');
    await expect(bar(page)).toHaveCount(0);
    await expect(faded).toHaveCount(0);
    await expect(page.getByTestId('ap-dots')).toHaveAttribute('data-ap', '4');

    await page.getByTestId('action-contributeOwnedProjects').click();
    await plusLow.click();
    await plusHigh.click();
    await confirmButton(page).click();
    await expect(page.getByTestId('ap-dots')).toHaveAttribute('data-ap', '3');
    await expect(project(page, 0).getByRole('img', { name: 'Alice 貢獻 2' })).toBeVisible();
    await expect(project(page, 3).getByRole('img', { name: 'Alice 貢獻 2' })).toBeVisible();
    await expect(project(page, 3).getByTestId('contribution-gain')).toHaveText('+1');
    if (mobile) await expect(project(page, 3).getByTestId('contribution-gain')).toHaveCSS('animation-name', 'none');
    await capture('confirmed');

    await page.getByTestId('action-recruit').click();
    await page.getByTestId('job-card-4evosn8').click();
    await project(page, 2).getByRole('button', { name: /選擇專案/ }).click();
    await confirmButton(page).click();
    await expect(page.getByTestId('ap-dots')).toHaveAttribute('data-ap', '2');
    await page.getByTestId('action-contributeJoinedProjects').click();
    const joined = project(page, 2);
    const plusJoined = joined.getByRole('button', { name: '增加 工程師 貢獻' });
    await expect(faded).toHaveCount(5);
    await expect(page.getByTestId('projects-yours').getByTestId('contribution-increment')).toHaveCount(0);
    await expect(page.getByTestId('projects-others').getByTestId('contribution-increment')).toHaveCount(1);
    await joined.getByRole('heading', { name: '掃了再買' }).click();
    await expect(panel(page)).toHaveAttribute('data-mode', 'contributeJoinedProjects');
    await expect(bar(page)).toHaveCount(0);
    for (let i = 0; i < 5; i++) await plusJoined.click();
    await expectBudget(page, 5, 5);
    await expect(plusJoined).toBeDisabled();
    await capture('joined-pending');
    await confirmButton(page).click();
    await expect(page.getByTestId('ap-dots')).toHaveAttribute('data-ap', '1');
    await expect(joined.getByRole('img', { name: 'Alice 貢獻 7' })).toBeVisible();
    await expect(joined.getByTestId('contribution-gain')).toHaveText('+5');
    await expect(bar(page)).toHaveCount(0);
    await expect(faded).toHaveCount(0);
    await capture('joined-confirmed');
  });
}
