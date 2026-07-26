import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import {
  closeDevTools,
  openDevTools,
  selectDevPerspective,
  selectDevTransport,
} from './devTools';

test.describe('Landing page', () => {
  test('shows Play button linking to /lobby', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('link', { name: /play online/i });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('href', '/lobby');
  });

  test('does not render developer controls on the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('dev-tools-open')).toHaveCount(0);
  });

  test('shows the unified board and collapsed developer widget on /dev', async ({ page }) => {
    await page.goto('/dev?user=player1&mode=offline');
    await expect(page.getByText(/^Developer View$/i)).toHaveCount(0);
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.locator('[data-testid^="player-status-"]').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('dev-tools-open')).toBeVisible();

    await openDevTools(page);
    await expect(page.getByRole('heading', { name: /developer controls/i })).toBeVisible();
    await closeDevTools(page);
  });
});

test.describe('Developer widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev?seed=e2e-2');
    await page.locator('[data-testid="context-action"][data-mode="idle"]').waitFor({
      state: 'visible',
      timeout: 20_000,
    });
  });

  test('loads player 1 and offline defaults from a minimal dev URL', async ({ page }) => {
    await openDevTools(page);
    await expect(page.getByRole('radio', { name: /Alice · Player 1/i })).toBeChecked();
    await expect(page.getByRole('radio', { name: /Offline · Local/i })).toBeChecked();
  });

  test('writes default developer controls back to the URL', async ({ page }) => {
    await expect(page).toHaveURL(/seed=e2e-2/);
    await expect(page).toHaveURL(/user=player1/);
    await expect(page).toHaveURL(/mode=offline/);
  });

  test('contains keyboard focus and restores it to the launcher', async ({ page }) => {
    const launcher = page.getByTestId('dev-tools-open');
    const drawer = page.getByTestId('dev-tools-drawer');
    const closeButton = page.getByTestId('dev-tools-close');
    const lastControl = page.getByTestId('dev-transport-offline').getByRole('radio');

    await launcher.focus();
    await page.keyboard.press('Enter');
    await expect(drawer).toBeVisible();
    await expect(closeButton).toBeFocused();

    // Fixed-position controls are visible and must remain in the modal's focus loop.
    await closeButton.evaluate((element) => {
      element.style.position = 'fixed';
    });

    await page.keyboard.press('Shift+Tab');
    await expect(lastControl).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
    await expect(launcher).toBeFocused();
  });

  test('stacks a game modal above developer controls and restores focus in order', async ({
    page,
  }) => {
    const launcher = page.getByTestId('dev-tools-open');
    const drawer = page.getByTestId('dev-tools-drawer');
    const closeDeveloperControls = page.getByTestId('dev-tools-close');
    const exitDialog = page.getByTestId('exit-dialog');

    await launcher.focus();
    await page.keyboard.press('Enter');
    await expect(drawer).toBeVisible();
    await expect(closeDeveloperControls).toBeFocused();

    // Simulate an automatic game dialog while the modal developer drawer has
    // made the board inert. User clicks on the inert board are intentionally blocked.
    await page.getByTestId('header-leave').evaluate((button: HTMLButtonElement) => button.click());
    await expect(page.getByRole('dialog')).toHaveCount(2);
    await expect(exitDialog).toBeVisible();
    await expect(page.getByTestId('exit-keep-seat')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(exitDialog).not.toBeVisible();
    await expect(drawer).toBeVisible();
    await expect(closeDeveloperControls).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
    await expect(launcher).toBeFocused();
  });

  test('switches player and observer perspectives without resetting the match', async ({ page }) => {
    await selectDevPerspective(page, 'player2');
    await expect(page).toHaveURL(/user=player2/);
    await expect(page.getByTestId('player-status-Bob')).toContainText('YOU');
    await expect(page.getByTestId('waiting-for-player-alert')).toContainText(/Waiting for Alice/i);

    await selectDevPerspective(page, 'observer');
    await expect(page).toHaveURL(/user=observer/);
    await expect(page.getByTestId('observer-mode-banner')).toBeVisible();
    await expect(page.locator('[data-testid="context-action"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="hand-card-"]')).toHaveCount(0);

    await selectDevPerspective(page, 'player1');
    await expect(page.locator('[data-testid="context-action"][data-mode="idle"]')).toBeVisible();
  });

  test('switches to a fresh three-player online match', async ({ page }) => {
    await page.getByTestId('refill-jobs').click();
    await page.locator('[data-testid^="job-card-"]').first().click();
    await page.getByTestId('ca-confirm').click();
    await expect(page.getByTestId('player-status-Alice')).toHaveAttribute('data-actions', '3');

    await selectDevTransport(page, 'online');
    await expect(page).toHaveURL(/mode=online/);
    await expect(page.locator('[data-testid^="player-status-"]')).toHaveCount(3, { timeout: 20_000 });
    await expect(page.getByTestId('player-status-Alice')).toHaveAttribute('data-actions', '4');
  });

  test('initializes from valid query state and rejects invalid configuration', async ({ page }) => {
    await page.goto('/dev?user=player2&mode=online');
    await expect(page.locator('[data-testid^="player-status-"]')).toHaveCount(3, { timeout: 20_000 });
    await expect(page.getByTestId('player-status-Bob')).toContainText('YOU');

    await openDevTools(page);
    await expect(page.getByRole('radio', { name: /Bob · Player 2/i })).toBeChecked();
    await expect(page.getByRole('radio', { name: /Online · SocketIO/i })).toBeChecked();

    await page.goto('/dev?user=alice&mode=remote');
    const configError = page.locator('main[role="alert"]');
    await expect(configError).toContainText('Invalid developer configuration');
    await expect(configError).toContainText('Invalid user "alice"');
    await expect(configError).toContainText('Invalid mode "remote"');
  });
});

test.describe('Lobby page', () => {
  test('renders Create room form and Open lobbies section', async ({ page }) => {
    await page.goto('/lobby');
    await expect(page.getByRole('heading', { name: /create room/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /open lobbies/i })).toBeVisible();
    await expect(page.getByLabel(/player name/i)).toBeVisible();
  });

  test('shows error on empty player name submit', async ({ page }) => {
    await page.goto('/lobby');
    await page.getByRole('button', { name: /建立房間/ }).click();
    await expect(page.getByText(/enter a player name/i)).toBeVisible();
  });

  test('shows error Alert when match list fails to load', async ({ page }) => {
    // Intercept to simulate fetch failure
    await page.route('**/games/**', route => route.abort());
    await page.goto('/lobby');
    // After failed load, should show error not "No public matches"
    await expect(page.getByText(/unable to load/i)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Full multiplayer flow', () => {
  let browser: Browser;
  let alice: BrowserContext;
  let bob: BrowserContext;
  let charlie: BrowserContext;
  let alicePage: Page;
  let bobPage: Page;
  let charliePage: Page;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    alice = await browser.newContext();
    bob = await browser.newContext();
    charlie = await browser.newContext();
    alicePage = await alice.newPage();
    bobPage = await bob.newPage();
    charliePage = await charlie.newPage();
  });

  test.afterAll(async () => {
    await alice.close();
    await bob.close();
    await charlie.close();
  });

  let matchID: string;

  test('Alice creates a 3-player match', async () => {
    await alicePage.goto('/lobby');
    await alicePage.getByLabel(/player name/i).fill('Alice');
    // Select 3 players (should already be default)
    await alicePage.getByRole('button', { name: /建立房間/ }).click();

    // Should redirect to /game/[matchID]
    await alicePage.waitForURL(/\/game\//, { timeout: 15_000 });
    matchID = alicePage.url().split('/game/')[1];
    expect(matchID).toBeTruthy();

    // Waiting room visible
    await expect(alicePage.getByRole('heading', { name: /waiting room/i, level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test('Bob joins via lobby', async () => {
    await bobPage.goto('/lobby');
    await bobPage.getByLabel(/player name/i).fill('Bob');
    // Wait for Alice's match to appear
    await expect(bobPage.getByRole('button', { name: /join/i }).first()).toBeVisible({ timeout: 15_000 });
    await bobPage.getByRole('button', { name: /join/i }).first().click();
    await bobPage.waitForURL(/\/game\//, { timeout: 15_000 });
    await expect(bobPage.getByRole('heading', { name: /waiting room/i, level: 1 })).toBeVisible({ timeout: 10_000 });
  });

  test('Charlie joins via direct URL', async () => {
    await charliePage.goto(`/game/${matchID}`);
    // No credentials — will see waiting room as observer or join prompt
    // If join flow needed, go through lobby
    await charliePage.goto('/lobby');
    await charliePage.getByLabel(/player name/i).fill('Charlie');
    await expect(charliePage.getByRole('button', { name: /join/i }).first()).toBeVisible({ timeout: 10_000 });
    await charliePage.getByRole('button', { name: /join/i }).first().click();
    await charliePage.waitForURL(/\/game\//, { timeout: 15_000 });
  });

  test('All seats filled — Alice sees Start Game, others see Waiting for host', async () => {
    // Alice is host (seat 0) — should see Start Game button
    await expect(alicePage.getByRole('button', { name: /start game/i })).toBeVisible({ timeout: 15_000 });
    // Bob and Charlie should see "Waiting for the host to start the game."
    await expect(bobPage.getByText(/waiting for the host/i)).toBeVisible({ timeout: 15_000 });
    await expect(charliePage.getByText(/waiting for the host/i)).toBeVisible({ timeout: 15_000 });
  });

  test('Alice starts the game — all players see the board', async () => {
    await alicePage.getByRole('button', { name: /start game/i }).click();
    // All should transition to game board — "Waiting Room" heading disappears
    await expect(alicePage.getByRole('heading', { name: /waiting room/i, level: 1 })).not.toBeVisible({ timeout: 20_000 });
    // Board view shows the game header with player chips
    await expect(alicePage.locator('[data-testid^="player-status-"]').first()).toBeVisible({ timeout: 20_000 });
    // Bob also transitions
    await expect(bobPage.getByRole('heading', { name: /waiting room/i, level: 1 })).not.toBeVisible({ timeout: 20_000 });
  });

  test('Observer can view game without credentials', async () => {
    const observer = await browser.newContext();
    const observerPage = await observer.newPage();
    await observerPage.goto(`/game/${matchID}`);
    // Should render the board in observer mode: banner + player chips, no hand/action controls
    await expect(observerPage.locator('[data-testid="observer-mode-banner"]')).toBeVisible({ timeout: 15_000 });
    await expect(observerPage.locator('[data-testid^="player-status-"]').first()).toBeVisible({ timeout: 15_000 });
    await expect(observerPage.locator('[data-testid="context-action"]')).toHaveCount(0);
    await observer.close();
  });

  test('Lobby offers 觀戰 for an in-progress room without a seat (#421)', async () => {
    const visitor = await browser.newContext();
    const visitorPage = await visitor.newPage();
    await visitorPage.goto('/lobby');
    const row = visitorPage.locator(`[data-testid="match-row-${matchID}"]`);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.locator('[data-testid="match-spectate"]')).toBeVisible();
    await row.locator('[data-testid="match-spectate"]').click();
    await visitorPage.waitForURL(`**/game/${matchID}`, { timeout: 15_000 });
    await expect(visitorPage.locator('[data-testid="observer-mode-banner"]')).toBeVisible({ timeout: 15_000 });
    await visitor.close();
  });

  test('Alice leaves keeping her seat and returns via 回到桌子 (#420 + #421)', async () => {
    // Leave goes through the explicit choice dialog — no immediate navigation.
    await alicePage.locator('[data-testid="header-leave"]').click();
    await expect(alicePage.locator('[data-testid="exit-dialog"]')).toBeVisible();
    await expect(alicePage).toHaveURL(new RegExp(`/game/${matchID}`));

    await alicePage.locator('[data-testid="exit-keep-seat"]').click();
    await alicePage.waitForURL(/\/lobby/, { timeout: 15_000 });

    // Her room offers 回到桌子, not Join.
    const row = alicePage.locator(`[data-testid="match-row-${matchID}"]`);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.locator('[data-testid="match-return"]')).toBeVisible();
    await row.locator('[data-testid="match-return"]').click();
    await alicePage.waitForURL(new RegExp(`/game/${matchID}`), { timeout: 15_000 });

    // Same seat resumed — board with her controls, not observer mode.
    await expect(alicePage.locator('[data-testid^="player-status-"]').first()).toBeVisible({ timeout: 20_000 });
    await expect(alicePage.locator('[data-testid="observer-mode-banner"]')).toHaveCount(0);
  });

  test('Bob releases his seat — the match terminates for the table (#420)', async () => {
    await bobPage.locator('[data-testid="header-leave"]').click();
    await expect(bobPage.locator('[data-testid="exit-dialog"]')).toBeVisible();
    await bobPage.locator('[data-testid="exit-leave-seat"]').click();
    await bobPage.waitForURL(/\/lobby/, { timeout: 15_000 });

    // Remaining players see the terminated notice over a blocked board.
    await expect(alicePage.locator('[data-testid="match-terminated-overlay"]')).toBeVisible({ timeout: 20_000 });

    // The room disappears from the active lobby list.
    await bobPage.getByRole('button', { name: /重新整理/ }).click();
    await expect(bobPage.locator(`[data-testid="match-row-${matchID}"]`)).toHaveCount(0, { timeout: 15_000 });
  });
});

test.describe('Game room edge cases', () => {
  test('Navigating to non-existent matchID shows the expired-room note', async ({ page }) => {
    await page.goto('/game/nonexistent-match-id-12345');
    // #419: an unknown or purged match must show the bilingual expired note,
    // never mount a fresh board under the old URL.
    await expect(page.locator('[data-testid="match-expired-note"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="match-expired-note"]')).toContainText('房間不存在或已過期');
  });
});
