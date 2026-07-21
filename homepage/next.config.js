const path = require('node:path');

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  turbopack: {
    root: path.resolve(__dirname, '..'),
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
