import { withSentryConfig } from '@sentry/nextjs';

const sentryDsn = process.env.SENTRY_DSN;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const canUploadSentrySourceMaps = Boolean(sentryDsn && sentryAuthToken && sentryOrg && sentryProject);

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
  authToken: sentryAuthToken,
  org: sentryOrg,
  project: sentryProject,
  release: process.env.SENTRY_RELEASE,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
};

export default canUploadSentrySourceMaps ? withSentryConfig(nextConfig, sentryConfig) : nextConfig;
