# Open StarTer Village - Web App

Open StarTer Village - Web App is a single-page application project designed for playing the game online. You can explore our [Web App Roadmap on the Wiki page](https://github.com/ocftw/open-star-ter-village/wiki/Webapp-Roadmap) for this website. Feel free to clone this project and create your Open StarTer Village on your local machine to enjoy with your friends or teams.

## How to Set Up Your Open StarTer Village Game

1. Visit our website (Currently not available)
2. Clone this project, host it, and enjoy!

### Clone this repository on your machine

```shell
git clone git@github.com:ocftw/open-star-ter-village.git open-star-ter-village
```

> Note: Open StarTer Village Game requires node >= 18.0.0

### Get Started

```shell
yarn run webapp install
yarn run webapp build
yarn run webapp start
```

## Deployment Options

### Deploy to Fly.io

Fly.io is the alpha deployment target for online multiplayer because it can run the Next.js client and long-lived boardgame.io SocketIO server in one Node container close to Taiwan players.

Rejected alternatives:

- Vercel: good fit for the Next.js client, poor fit for the long-lived in-memory SocketIO game server.
- Render: workable, but the free/low-cost sleep behavior is a bad fit for live matches.
- Railway: workable, but Fly.io gives more explicit region and VM control for this alpha.

### Deploy Your Own Village

Prerequisites:

- A Fly.io account.
- The `flyctl` CLI.
- Node.js 18+ and Yarn 3.4.1 for local verification.

Create an app:

```shell
cp fly.toml.example fly.toml
# Edit fly.toml and replace your-village-app with your Fly app name.
fly launch --copy-config
```

The included `fly.toml` is the Open StarTer Village alpha deployment config and is safe to publish because it contains app routing, region, and build-time public URLs only. It does not contain Fly API tokens, CORS secrets, webhooks, or private credentials. For your own deployment, start from `fly.toml.example` and replace the app name and public URLs.

Both Fly configs use one Fly app and one container. The Next.js client listens on port 3000, and the boardgame.io server listens on port 3001.

Required configuration:

- `NEXT_PUBLIC_GAME_SERVER_URL`: public URL for the game server. This is inlined by Next.js at build time, so set it as a Docker build argument before `next build`; changing a runtime env var later will not update the browser bundle.
- `GAME_SERVER_ORIGINS`: comma-separated allowed browser origins for the game server CORS policy. Set this as a Fly secret.

Example:

```shell
fly secrets set GAME_SERVER_ORIGINS=https://open-star-ter-village.fly.dev
fly deploy --build-arg NEXT_PUBLIC_GAME_SERVER_URL=https://open-star-ter-village.fly.dev:3001
```

For a custom domain, add the certificate in Fly and include that origin in `GAME_SERVER_ORIGINS`:

```shell
fly certs add village.example.org
fly secrets set GAME_SERVER_ORIGINS=https://village.example.org
fly deploy --build-arg NEXT_PUBLIC_GAME_SERVER_URL=https://village.example.org:3001
```

The alpha runs on `shared-cpu-1x` with 256 MB memory and keeps one machine warm. Expect roughly USD $2-5/month depending on region, transfer, and Fly pricing changes.

Match state is in memory for alpha. Restarts lose active matches until the post-alpha persistence task lands.

Run the [external-network smoke test](./docs/deploy-smoke-test.md) after every deploy.

## How to Contribute to the Source Code

Open StarTer Village - WebApp is a TypeScript monorepo configured with Yarn 2 using the workspace-tools plugin. The core game engine is based on [boardgame.io](https://boardgame.io) on both the server and client side. The Open StarTer Village - WebApp project is divided into three parts: core game logic, client UI, and the game server. Below is a table showing their npm project names and locations:

| Project Name                                   | Description             |
| ---------------------------------------------- | ----------------------- |
| [`@open-star-ter-village/webapp`](./packages/webapp/) | The web game app |

### How to Start the Local Development Environment

You should clone the project and navigate to the webapp folder before starting local development. Please refer to the [instructions for creating your Open StarTer Village game](#how-to-create-your-open-star-ter-village-game) if you haven't done that yet.

Open StarTer Village - Web App uses Yarn 2 workspaces to manage the project. Please ensure you have the [latest Yarn](https://yarnpkg.com/getting-started/install) installed on your machine before getting started. Don't worry, the Yarn 2 upgrade is on a per-project basis, so you can still access other projects with classic Yarn 1. Please note that there have been [CLI command changes](https://yarnpkg.com/getting-started/migration#cli-commands) as well.

The following command will start the client UI (Create React App) on a development server, the server (Koa) using ts-node with watchmon, and the game core (pure TypeScript) in watch compile mode.

```shell
yarn run webapp dev
```

Everything is set up and ready for you to start coding!

#### Local Build

The following command will build nextjs webapp into `packages/webapp/.next` and server into `packages/webapp/dist`.

```shell
yarn run webapp build
```

#### Local Start

After building the project, you can start the server and webapp with the following command:

```shell
yarn run webapp start
```

#### Unit Test (Currently only available for game core)

```shell
yarn run webapp test
```

## How to Contribute to Assets

If you'd like to contribute assets, please create an issue to discuss your ideas with the team. They may invite you for further discussions. Afterward, you can create a pull request to upload your contributions.
