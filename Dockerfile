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
ENV NEXT_PUBLIC_GAME_SERVER_URL=$NEXT_PUBLIC_GAME_SERVER_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY packages/webapp ./packages/webapp
RUN yarn webapp build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY packages/webapp/package.json ./packages/webapp/package.json
RUN yarn workspaces focus @open-star-ter-village/webapp --production

COPY --from=build /app/packages/webapp/.next/standalone ./
COPY --from=build /app/packages/webapp/.next/static ./packages/webapp/.next/static
COPY --from=build /app/packages/webapp/public ./packages/webapp/public
COPY --from=build /app/packages/webapp/dist ./packages/webapp/dist
RUN mkdir -p /app/node_modules/@ \
  && ln -s /app/packages/webapp/dist/game /app/node_modules/@/game

EXPOSE 3000 3001

CMD ["sh", "-c", "yarn workspace @open-star-ter-village/webapp next start -H 0.0.0.0 -p 3000 & PORT=3001 node packages/webapp/dist/server.js & wait"]
