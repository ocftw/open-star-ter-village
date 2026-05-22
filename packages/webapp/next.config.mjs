import { withSentryConfig } from '@sentry/nextjs';

const sentryDsn = process.env.SENTRY_DSN;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    SENTRY_DSN: sentryDsn,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    SENTRY_RELEASE: process.env.SENTRY_RELEASE,
  },
};

const sentryConfig = {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  release: process.env.SENTRY_RELEASE,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
};

export default sentryDsn ? withSentryConfig(nextConfig, sentryConfig) : nextConfig;
