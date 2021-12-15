# Webapp - game

This is the core logic of the board game. The methods and state management can be found it in the follows.

## Types

### Card

Project, Resource, and Event cards are shuffled and formed into three decks respectively in the game.

First, Project cards are played from the players' hands on the table. A project card on the table represents an active project in the game. Second, Resource cards are played from the players' hands and divided into two subtypes - job cards and force cards. Job cards are played from hand onto an active project to take a vacancy position. Force cards are played in front of the player or onto an active project. Their effect is either single-use, equipped (on a project or player), or continuous when it is on the table. Last, Event cards are played on the table from the deck. The effects are similar to Force cards.

```bash
namespace Card
|- Project: string
|- Resource: string
|- Job: string
|- Force: string
|- Event: string
```

### State

State shares across on all clients (players) and the server and rendered by the client side to be interacted with players.

```bash
namespace State
|- Root
|  |- rules: State.Rule
|  |- decks
|  |  |- projects: State.Deck<Card.Project>
|  |  |- resources: State.Deck<Card.Resource>
|  |  |- events: State.Deck<Card.Event>
|  |- table: State.Table
|  |- players
|     |- [playerId]: State.Player
|
|- Rule // TBD: should be the same hierarchy as State.Root
|
|- Deck<T>
|  |- pile: T[]
|  |- discardPile: T[]
|
|- Table
|  |- activeEvent: Card.Event | null
|  |- activeProjects: Project[]
|
|- Player
|  |- hand (hidden to observer)
|  |  |- projects: Card.Project[]
|  |  |- resources: Card.Resource[]
|  |
|  |- token
|  |  |- workers: number
|  |
|  |- completed
|     |- projects: Card.Project[]
|
|- Project
|  |- card: Card.Project
|
|- Tree
   |- [treeTypes]: number
```
