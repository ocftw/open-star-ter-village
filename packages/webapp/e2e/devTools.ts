import { expect, type Page } from '@playwright/test';

const PERSPECTIVE_LABELS = {
  player1: /Alice · Player 1/i,
  player2: /Bob · Player 2/i,
  player3: /Charlie · Player 3/i,
  observer: /^Observer$/i,
} as const;

export type DevPerspective = keyof typeof PERSPECTIVE_LABELS;

export async function openDevTools(page: Page): Promise<void> {
  const drawer = page.getByTestId('dev-tools-drawer');
  if (await drawer.isVisible()) {
    return;
  }

  await page.getByTestId('dev-tools-open').click();
  await expect(drawer).toBeVisible();
}

export async function closeDevTools(page: Page): Promise<void> {
  const drawer = page.getByTestId('dev-tools-drawer');
  if (!(await drawer.isVisible())) {
    return;
  }

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
  await closeDevTools(page);
}
