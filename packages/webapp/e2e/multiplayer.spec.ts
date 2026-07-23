import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows Play button linking to /lobby', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('link', { name: /play online/i });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('href', '/lobby');
  });

  test('does not render DevView on the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/developer view/i)).not.toBeVisible();
  });

  test('shows DevView on /dev', async ({ page }) => {
    await page.goto('/dev');
    await expect(page.getByText(/developer view/i).first()).toBeVisible({ timeout: 10_000 });
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
