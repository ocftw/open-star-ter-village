import { expect, type Page } from '@playwright/test';

const PERSPECTIVE_LABELS = {
  player1: /Alice · Player 1/i,
  player2: /Bob · Player 2/i,
  player3: /Charlie · Player 3/i,
  observer: /^Observer$/i,
} as const;

export type DevPerspective = keyof typeof PERSPECTIVE_LABELS;

/** START, refill, and contribution can mount confirmation outside the action panel. */
export const confirmButton = (page: Page) => page.getByTestId('ca-confirm');

/** Wait for the show-once decision, including seen rounds and finished games. */
export async function dismissRoundStartOverlay(page: Page): Promise<void> {
  await expect(page.locator('[data-game-board]')).toHaveAttribute('data-round-start-ready', 'true', { timeout: 20_000 });
  const overlay = page.getByTestId('round-start-overlay');
  if (await overlay.isVisible()) {
    await overlay.getByRole('button', { name: '知道了', exact: true }).click();
    await expect(overlay).toHaveCount(0);
  }
}

export async function openDevTools(page: Page): Promise<void> {
  const drawer = page.getByTestId('dev-tools-drawer');
  await page.getByTestId('dev-tools-open').click();
  await expect(drawer).toBeVisible();
}

export async function closeDevTools(page: Page): Promise<void> {
  const drawer = page.getByTestId('dev-tools-drawer');
  await page.getByTestId('dev-tools-close').click();
  await expect(drawer).not.toBeVisible();
}

export async function selectDevPerspective(
  page: Page,
  perspective: DevPerspective,
): Promise<void> {
  await openDevTools(page);
  await page.getByRole('radio', { name: PERSPECTIVE_LABELS[perspective] }).check();
  await expect(page.getByRole('radio', { name: PERSPECTIVE_LABELS[perspective] })).toBeChecked();
  await closeDevTools(page);
}

export async function selectDevTransport(
  page: Page,
  transport: 'offline' | 'online',
): Promise<void> {
  await openDevTools(page);
  const label = transport === 'offline' ? /Offline · Local/i : /Online · SocketIO/i;
  await page.getByRole('radio', { name: label }).check();
  await expect(page.getByRole('radio', { name: label })).toBeChecked();
  // A transport change mounts a new match while the drawer is still open.
  await dismissRoundStartOverlay(page);
  await closeDevTools(page);
}
