# Open Star Ter Village - Web App

Open Star Ter Village - Web App is a single-page application project designed for playing the game online. You can explore our [Web App Roadmap on the Wiki page](https://github.com/ocftw/open-star-ter-village/wiki/Webapp-Roadmap) for this website. Feel free to clone this project and create your Open Star Ter Village on your local machine to enjoy with your friends or teams.

## How to Set Up Your Open Star Ter Village Game

1. Visit our website (Currently not available)
2. Clone this project, host it, and enjoy!

### Clone this repository on your machine

```shell
git clone git@github.com:ocftw/open-star-ter-village.git open-star-ter-village
```

> Note: OpenStarTerVillage requires node >= 12.0.0

### Get Started

```shell
yarn
yarn build:webapp
yarn deploy:webapp
yarn start:webapp
```

## Deployment Options

### Deploying to Heroku (Please note, we are exploring alternative solutions to Heroku due to certain limitations)

```shell
heroku create
git push heroku main
heroku open
```

or

[![Deploy to Heroku (Exploring Alternative Solutions)](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ocftw/open-star-ter-village/tree/main)

## How to Contribute to the Source Code

OpenStarTerVillage - WebApp is a TypeScript monorepo configured with Yarn 2 using the workspace-tools plugin. The core game engine is based on [boardgame.io](https://boardgame.io) on both the server and client side. The OpenStarTerVillage - WebApp project is divided into three parts: core game logic, client UI, and the game server. Below is a table showing their npm project names and locations:

| Project Name                                    | Description          |
| ---------------------------------------------- | --------------------   |
| [`@open-star-ter-village/webapp-game`](./packages/game/) | The core game logic   |
| [`@open-star-ter-village/webapp-client`](./client/)      | The client UI         |
| [`@open-star-ter-village/webapp-server`](./server/)      | The game server       |

### How to Start the Local Development Environment

You should clone the project and navigate to the webapp folder before starting local development. Please refer to the [instructions for creating your Open Star Ter Village game](#how-to-create-your-open-star-ter-village-game) if you haven't done that yet.

OpenStarTerVillage - Web App uses Yarn 2 workspaces to manage the project. Please ensure you have the [latest Yarn](https://yarnpkg.com/getting-started/install) installed on your machine before getting started. Don't worry, the Yarn 2 upgrade is on a per-project basis, so you can still access other projects with classic Yarn 1. Please note that there have been [CLI command changes](https://yarnpkg.com/getting-started/migration#cli-commands) as well.

The following command will start the client UI (Create React App) on a development server, the server (Koa) using ts-node with watchmon, and the game core (pure TypeScript) in watch compile mode.

```shell
yarn dev:webapp
```

Everything is set up and ready for you to start coding!

#### Local Build

OpenStarTerVillage - Web App has three primary outcomes: `client` and `server`, which serve the game on the platform, and other outputs used as libraries in parts of `client` and `server`.

```shell
yarn build:webapp
```

Project output table
| Project Name                                 | Output Location            | Description            |
| -------------------------------------------- | -----------------------    | -----------------------  |
| `@open-star-ter-village/webapp-game`         | ./packages/game/dist       | The core game logic     |
| `@open-star-ter-village/webapp-client`       | ./client/build             | The client UI           |
| `@open-star-ter-village/webapp-server`       | ./server/build             | The game server         |

> Note: The output folders are ignored by Git, but you can find them after the build process.

#### Unit Test (Currently not available)

```shell
yarn test
```

## How to Contribute to Assets

If you'd like to contribute assets, please create an issue to discuss your ideas with the team. They may invite you for further discussions. Afterward, you can create a pull request to upload your contributions.
