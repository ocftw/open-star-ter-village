import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

// From packages/webapp, build with NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3571.
// Serve the production client on 3570 and game server on 3571, then run:
// PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers node docs/game-room/issue-497/capture-wild.mjs
const web = 'http://localhost:3570';
const lobby = 'http://localhost:3571/games/OpenStarTerVillage';
const output = process.argv[2] ?? fileURLToPath(new URL('./', import.meta.url));

async function post(route, data) {
  const response = await fetch(`${lobby}${route}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Lobby request failed (${response.status})`);
  return response.json();
}

const { matchID } = await post('/create', {
  numPlayers: 2,
  setupData: { forcedFirstEvent: 'ignore_first_worker_requirement' },
});
const { playerCredentials: credential } = await post(`/${matchID}/join`, {
  playerID: '0', playerName: 'Alice', data: { displayName: 'Alice' },
});
await post(`/${matchID}/join`, { playerID: '1', playerName: 'Bob', data: { displayName: 'Bob' } });
await post(`/${matchID}/update`, {
  playerID: '0', credentials: credential, data: { started: true, displayName: 'Alice' },
});

await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 832 }, reducedMotion: 'reduce' });
  await page.addInitScript((seat) => {
    localStorage.setItem(`open-star-ter-village.match-credentials.${seat.matchID}`, JSON.stringify(seat));
    localStorage.setItem('open-star-ter-village.player-name', seat.playerName);
  }, { matchID, playerID: '0', credential, playerName: 'Alice' });
  await page.goto(`${web}/game/${matchID}`);
  await page.locator('[data-game-board][data-round-start-ready="true"]').waitFor();
  const overlay = page.getByTestId('round-start-overlay');
  if (await overlay.isVisible()) {
    await overlay.getByRole('button', { name: '知道了', exact: true }).click();
    await overlay.waitFor({ state: 'detached' });
  }
  await page.evaluate(() => document.fonts.ready);

  const market = page.getByTestId('job-market');
  const jobs = market.locator('[data-testid^="job-card-"]');
  const wild = jobs.and(market.locator('[data-wild="true"]'));
  await expect(wild).toBeVisible();
  const wildId = await wild.getAttribute('data-testid');
  const ordinary = await jobs.evaluateAll((tiles) => tiles.filter((tile) => !tile.dataset.wild)
    .map((tile) => ({ id: tile.dataset.testid, name: tile.dataset.jobName })));
  const projects = await page.getByTestId('hand-panel').locator('[data-testid^="hand-card-"]')
    .evaluateAll((cards) => cards.map((card) => ({ id: card.dataset.testid, names: card.dataset.requirements.split(',') })));
  const project = projects.find(({ names }) => ordinary.some(({ name }) => names.includes(name))
    && ordinary.some(({ name }) => !names.includes(name)));
  if (!project) throw new Error('This match has no project that shows both matching and mismatched ordinary jobs.');
  const matches = ordinary.filter(({ name }) => project.names.includes(name));
  const mismatches = ordinary.filter(({ name }) => !project.names.includes(name));

  const capture = (state) => page.screenshot({ path: resolve(output, `1280-wild-${state}.png`), animations: 'disabled' });
  await page.getByTestId('action-createProject').click();
  await page.getByTestId(project.id).click();
  expect(await jobs.evaluateAll((tiles) => tiles.map((tile) => tile.dataset.testid))).toEqual([
    ...matches.map(({ id }) => id), wildId, ...mismatches.map(({ id }) => id),
  ]);
  await expect(wild).toBeEnabled();
  for (const { id } of mismatches) await expect(market.getByTestId(id)).toBeDisabled();
  const picker = page.getByTestId('start-wild-picker');
  await expect(picker).toHaveCount(0);
  await capture('project-first');

  await wild.click();
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('button')).toHaveText([...project.names, '取消']);
  await capture('picker');

  await picker.getByRole('button', { name: project.names.at(-1), exact: true }).click();
  await page.getByTestId('ca-confirm').click();
  await expect(wild).toHaveCount(0);
  await expect(page.getByTestId('projects-yours').locator('[data-start-placed]')).toBeVisible();
  await capture('success');
} finally {
  await browser.close();
}
