/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  swcMinify: true,
  i18n: {
    locales: ['zh-tw', 'en'],
    defaultLocale: 'zh-tw',
  },
  trailingSlash: true,
};
