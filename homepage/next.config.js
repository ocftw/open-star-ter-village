/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  turbopack: {
    root: __dirname,
  },
  i18n: {
    locales: ['zh-Hant', 'en'],
    defaultLocale: 'zh-Hant',
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
