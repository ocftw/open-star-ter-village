import { expect, test } from '@playwright/test';
import { installDeterministicRendering } from './helpers.mjs';

const analyticsEvents = (page, event, promotionId) =>
  page.evaluate(
    ({ requestedEvent, requestedPromotionId }) =>
      (window.dataLayer ?? []).filter(
        (entry) =>
          entry.event === requestedEvent &&
          entry.ecommerce?.promotion_id === requestedPromotionId,
      ),
    { requestedEvent: event, requestedPromotionId: promotionId },
  );

test.beforeEach(async ({ page }) => {
  await installDeterministicRendering(page);
});

test('tracks the footer promotion and keeps its internal navigation in one tab', async ({
  page,
}) => {
  await page.goto('/');
  const footerLink = page.getByRole('link', { name: '來玩線上桌遊！' });

  await expect(footerLink).not.toHaveAttribute('target', '_blank');
  await footerLink.scrollIntoViewIfNeeded();
  await expect
    .poll(
      async () =>
        (await analyticsEvents(page, 'view_promotion', 'footer_play_online'))
          .length,
    )
    .toBe(1);

  await footerLink.click();
  await expect(page).toHaveURL(/\/resource\/#/);
  expect(decodeURIComponent(new URL(page.url()).hash)).toBe('#線上桌遊一起玩');
});

test('tracks the resource promotion and opens the game safely in a new tab', async ({
  page,
}) => {
  await page.goto('/resource/');
  const bannerLink = page
    .locator('.cta-banner')
    .getByRole('link', { name: '來玩線上桌遊！' });

  await expect(bannerLink).toHaveAttribute('target', '_blank');
  await expect(bannerLink).toHaveAttribute('rel', 'noopener noreferrer');
  await bannerLink.scrollIntoViewIfNeeded();
  await expect
    .poll(
      async () =>
        (await analyticsEvents(page, 'view_promotion', 'resource_play_online'))
          .length,
    )
    .toBe(1);

  await bannerLink.evaluate((link) =>
    link.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    }),
  );
  await bannerLink.click();
  await expect
    .poll(
      async () =>
        (
          await analyticsEvents(
            page,
            'select_promotion',
            'resource_play_online',
          )
        ).length,
    )
    .toBe(1);
});
