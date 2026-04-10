/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  swcMinify: true,
  i18n: {
    locales: ['zh-Hant', 'en'],
    defaultLocale: 'zh-Hant',
  },
  trailingSlash: true,
};
