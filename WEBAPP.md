# 開源星手村 - 網頁版

# Open Star Ter Village - Web App

Open Star Ter Village - Web App is a single page application project for playing the game online. You can find out our [road map](./ROADMAP.md) of this web site. You can freely clone this project and create your Open Star Ter Village on your machine and enjoy with your friends/teams.

## How to create your open-star-ter-village game

1. visit our website *[not ready yet]*
2. clone this project, host it and enjoy!

### clone this repository in your machine

```shell
git clone git@github.com:ocftw/open-star-ter-village.git open-star-ter-village
```

> Note: OpenStarTerVillage requires node >= 12.0.0

### spinning up*

```shell
yarn
yarn build:webapp
yarn deploy:webapp
yarn start:webapp
```

## Deploying to Heroku

```
$ heroku create
$ git push heroku main
$ heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ocftw/open-star-ter-village/tree/main)

## How to contribute in source code

OpenStarTerVillage - WebApp is a typescript monorepo configure by yarn 2 with workspace-tools plugin. The core game engine is based on [boardgame.io](https://boardgame.io) on both server and client side. OpenStarTerVillage -  WebApp project divides into three parts. Core game logic, client UI, and game server. Their npm project name and locations are as follow table.

| Project name                           | Location                           | Description         |
| -------------------------------------- | ---------------------------------- | ------------------- |
| `@open-star-ter-village/webapp-game`   | [./packages/game](./packages/game) | The core game logic |
| `@open-star-ter-village/webapp-client` | [./client](./client)               | The client UI       |
| `@open-star-ter-village/webapp-server` | [./server](./server)               | The game server     |

### How to start the local development environment

You should clone the project and dive into the webapp folder before you kick off the local development. Please [clone the project and go to the webapp folder](#how-to-create-your-open-star-ter-village-game) if you haven't done it yet.

OpenStarTerVillage - Web app is using yarn 2 workspaces to manage the project. Please ensure you have [latest yarn](https://yarnpkg.com/getting-started/install) in your machine before you start it. But don't worry, the yarn 2 upgrade is by-project basis so you can still access the other project with classic yarn 1. Please note that there are some [cli command changes](https://yarnpkg.com/getting-started/migration#cli-commands) as well.

The follow command would start client UI (create-react-app) in dev server, server (koa) in ts-node under watchmon, and game core (pure-typescript) in watch compile mode.

```shell
yarn dev:webapp
```

Everything is settle up. Ready, get, set, code!

#### local build

There are three outcome in OpenStarTerVillage - Web app. The major outcomes are `client` and `server` which are served the game on the platform. The other output would be used as library in part of `client` and `server`.


```shell
yarn build:webapp
```

The project output table
| Project name                           | Output Location      | Description         |
| -------------------------------------- | -------------------- | ------------------- |
| `@open-star-ter-village/webapp-game`   | ./packages/game/dist | The core game logic |
| `@open-star-ter-village/webapp-client` | ./client/build       | The client UI       |
| `@open-star-ter-village/webapp-server` | ./server/build       | The game server     |

> Note: The output folders are ignored by git. You can find them after built.

#### Unit test *[not ready yet]*

```shell
yarn test
```

## How to contribute in assets

Please create an issue about the assets you would like to contribute in. The team may invite you to have further discussion about your idea. Then you may create a pull request to upload your contributions.
