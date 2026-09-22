import path from 'node:path';
import type { NextConfig } from 'next';
import { defaultLocale, locales } from './src/lib/i18n';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  i18n: {
    locales: [...locales],
    defaultLocale,
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
