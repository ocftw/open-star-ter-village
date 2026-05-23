# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/webapp/package.json ./packages/webapp/package.json
RUN yarn install --immutable

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
  yarn webapp build

FROM node:20-alpine AS runtime
WORKDIR /app

ARG NEXT_PUBLIC_GAME_SERVER_URL=http://localhost:3001
ARG SENTRY_ENVIRONMENT=production
ARG SENTRY_RELEASE
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_GAME_SERVER_URL=$NEXT_PUBLIC_GAME_SERVER_URL
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT
ENV SENTRY_RELEASE=$SENTRY_RELEASE

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/webapp/package.json ./packages/webapp/package.json
RUN yarn workspaces focus @open-star-ter-village/webapp --production

COPY --from=build /app/packages/webapp/.next/standalone ./
COPY --from=build /app/packages/webapp/.next/static ./packages/webapp/.next/static
COPY --from=build /app/packages/webapp/public ./packages/webapp/public
COPY --from=build /app/packages/webapp/dist ./packages/webapp/dist
COPY packages/webapp/register-dist-alias.js ./packages/webapp/register-dist-alias.js

EXPOSE 3000 3001

CMD ["sh", "-c", "yarn workspace @open-star-ter-village/webapp next start -H 0.0.0.0 -p 3000 & PORT=3001 yarn workspace @open-star-ter-village/webapp start:server & wait"]
