/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  i18n: {
    locales: ['zh-tw', 'en'],
    defaultLocale: 'zh-tw',
  },
};
