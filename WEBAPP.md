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

### Deploy to Vercel

TBD - We are working on this feature.

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
