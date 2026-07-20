# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/webapp/package.json ./packages/webapp/package.json
COPY homepage/package.json ./homepage/package.json

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store && \
  pnpm install --frozen-lockfile --filter @open-star-ter-village/webapp...

FROM deps AS build
WORKDIR /app

ARG NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001
ARG SENTRY_DSN
ARG SENTRY_ENVIRONMENT=production
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ENV NEXT_PUBLIC_GAME_SERVER_URL=$NEXT_PUBLIC_GAME_SERVER_URL
ENV SENTRY_DSN=$SENTRY_DSN
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_PROJECT=$SENTRY_PROJECT
ENV SENTRY_RELEASE=$SENTRY_RELEASE
ENV NEXT_TELEMETRY_DISABLED=1

COPY packages/webapp ./packages/webapp
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN,required=false \
  SENTRY_AUTH_TOKEN="$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || true)" \
  pnpm webapp build

FROM base AS production-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store && \
  pnpm install --prod --frozen-lockfile --filter @open-star-ter-village/webapp...

FROM node:24-alpine AS runtime
WORKDIR /app

ARG NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001
ARG SENTRY_ENVIRONMENT=production
ARG SENTRY_RELEASE
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GAME_SERVER_URL=$NEXT_PUBLIC_GAME_SERVER_URL
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT
ENV SENTRY_RELEASE=$SENTRY_RELEASE

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/packages/webapp/node_modules ./packages/webapp/node_modules

COPY --from=build /app/packages/webapp/.next/standalone ./
COPY --from=build /app/packages/webapp/.next/static ./packages/webapp/.next/static
COPY --from=build /app/packages/webapp/public ./packages/webapp/public
COPY --from=build /app/packages/webapp/dist ./packages/webapp/dist
COPY packages/webapp/register-dist-alias.js ./packages/webapp/register-dist-alias.js
COPY packages/webapp/scripts/start-production.sh ./packages/webapp/scripts/start-production.sh

EXPOSE 3000 3001

CMD ["sh", "packages/webapp/scripts/start-production.sh"]
