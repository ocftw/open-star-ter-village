import { expect, test, type Page } from '@playwright/test';
import { installDeterministicRendering } from './helpers';

const analyticsEvents = (page: Page, event: string, promotionId: string) =>
  page.evaluate(
    ({ requestedEvent, requestedPromotionId }) =>
      (window.dataLayer ?? []).filter(
        (entry) =>
          entry.event === requestedEvent &&
          (entry.ecommerce as { promotion_id?: string } | undefined)
            ?.promotion_id === requestedPromotionId,
      ),
    { requestedEvent: event, requestedPromotionId: promotionId },
  );

const linkClickEvents = (page: Page, linkId: string) =>
  page.evaluate(
    (requestedLinkId) =>
      (window.dataLayer ?? []).filter(
        (entry) =>
          entry.event === 'link_click' && entry.link_id === requestedLinkId,
      ),
    linkId,
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
  await expect
    .poll(
      async () => (await linkClickEvents(page, 'footer_play_online')).length,
    )
    .toBe(1);
  expect((await linkClickEvents(page, 'footer_play_online'))[0]).toMatchObject({
    link_placement: 'site_footer',
    link_target: '_self',
    locale: 'zh-Hant',
    viewport_bucket: 'desktop',
  });
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
  await expect
    .poll(
      async () => (await linkClickEvents(page, 'resource_play_online')).length,
    )
    .toBe(1);
  expect(
    (await linkClickEvents(page, 'resource_play_online'))[0],
  ).toMatchObject({
    link_placement: 'resource_online_game_banner',
    link_target: '_blank',
    is_external: true,
  });
});

test('keeps the English footer promotion on the English resource page', async ({
  page,
}) => {
  await page.goto('/en/');
  const footerLink = page.getByRole('link', { name: 'Play Online!' });

  await footerLink.click();
  await expect(page).toHaveURL(/\/en\/resource\/#play-online-together$/);
  await expect(
    page.locator('#play-online-together').getByRole('link', {
      name: 'Play Online',
    }),
  ).toBeVisible();
});

test('buckets untagged links so the link_id dimension stays low cardinality', async ({
  page,
}) => {
  await page.goto('/');
  const adminLink = page.getByRole('link', { name: '後台管理' });

  await adminLink.evaluate((link) =>
    link.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    }),
  );
  await adminLink.click();

  await expect
    .poll(async () => (await linkClickEvents(page, 'internal:untagged')).length)
    .toBe(1);
  expect((await linkClickEvents(page, 'internal:untagged'))[0]).toMatchObject({
    link_url: expect.stringContaining('/admin'),
    is_external: false,
  });
});

test('keeps the locale-independent admin link unprefixed in every locale', async ({
  page,
}) => {
  await page.goto('/en/');
  const adminLink = page.getByRole('link', { name: 'Admin' });

  await expect(adminLink).toHaveAttribute('href', '/admin/');

  await page.goto('/');
  await expect(page.getByRole('link', { name: '後台管理' })).toHaveAttribute(
    'href',
    '/admin/',
  );
});

test('treats a mailto footer link as neither external nor localized', async ({
  page,
}) => {
  await page.goto('/en/');
  const enMail = page.getByRole('link', { name: 'Rent a Boardgame' });

  await expect(enMail).toHaveAttribute('href', 'mailto:hi@ocf.tw');
  // Only http(s) links are treated as external, so a mailto link keeps the
  // current tab and carries no rel hardening it does not need.
  await expect(enMail).not.toHaveAttribute('target', '_blank');
  await expect(enMail).not.toHaveAttribute('rel', 'noopener noreferrer');

  await page.goto('/');
  await expect(
    page.getByRole('link', { name: '租借實體桌遊' }),
  ).toHaveAttribute('href', 'mailto:hi@ocf.tw');
});
