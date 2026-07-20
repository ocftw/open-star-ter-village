import { expect } from '@playwright/test';

export const publicRoutes = [
  {
    name: 'zh-home',
    path: '/',
    text: '開源星手村',
    status: 200,
    locale: 'zh-Hant',
  },
  {
    name: 'zh-cards',
    path: '/cards/',
    text: '卡片介紹',
    status: 200,
    locale: 'zh-Hant',
  },
  {
    name: 'zh-resource',
    path: '/resource/',
    text: '資源分享',
    status: 200,
    locale: 'zh-Hant',
  },
  {
    name: 'zh-not-found',
    path: '/missing-page/',
    text: 'NOT FOUND',
    status: 404,
    locale: 'zh-Hant',
  },
  {
    name: 'en-home',
    path: '/en/',
    text: 'Open StarTer Village',
    status: 200,
    locale: 'en',
  },
  {
    name: 'en-cards',
    path: '/en/cards/',
    text: 'Talent, Event & Project Cards',
    status: 200,
    locale: 'en',
  },
  {
    name: 'en-resource',
    path: '/en/resource/',
    text: 'Resource Sharing',
    status: 200,
    locale: 'en',
  },
  {
    name: 'en-not-found',
    path: '/en/missing-page/',
    text: 'NOT FOUND',
    status: 404,
    locale: 'en',
  },
];

export const installDeterministicRendering = async (page) => {
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.abort(),
  );
};

export const waitForStablePage = async (page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition: none !important;
      }
    `,
  });
  await page.evaluate(async () => {
    await document.fonts.ready;

    const pageHeight = document.documentElement.scrollHeight;
    const scrollSteps = 50;
    for (let index = 0; index <= scrollSteps; index += 1) {
      window.scrollTo(0, (pageHeight * index) / scrollSteps);
      await new Promise((resolve) =>
        requestAnimationFrame(() => setTimeout(resolve, 20)),
      );
    }
    window.scrollTo(0, 0);

    await Promise.race([
      Promise.all(
        [...document.images].map((image) => image.decode().catch(() => {})),
      ),
      new Promise((resolve) => setTimeout(resolve, 10_000)),
    ]);
  });

  await expect(page.locator('body')).toBeVisible();
};
