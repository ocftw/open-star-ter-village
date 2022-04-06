# Roadmap

This is the living document capture the current area of focus, and what needs to be done before we are ready to online.

* Areas that need help are marked with *[help needed]*.
* Stuff that team is working on is marked with *[T]*.

## First release

### Host Open Star Ter Village

* [x] serve client build
* [x] refactor build folder under webapp/build
  * [x] copy client build
  * [x] copy server build and host both client pages and api requests
* [x] deploy to heroku
* [x] user can see the "click-to-deploy" button on the readme file when landed in the project
  * [x] user can see the "click-to-deploy" button on the readme file with comprehensive information of the webapp project
  * [x] As a developer, I would like to understand how the heroku works with Open Star Ter Village webapp project

#### implementation

* [ ] heroku single application deployment TBD *[T]*

### Basic game logics

* [x] Play Project cards
  * [x] Basic play function
  * [x] Fill in jobs
  * [x] Play Job card with Project card (validate, check eligible included)
  * [x] Reduce player action point (validate, check eligible included)
  * [x] Reduce player worker token (validate, check eligible included)
* [x] Play Job cards
  * [x] basic play function
  * [x] Play Job card on an Active project (includes validation and eligibility check)
  * [x] Deduct player action point (includes validation and eligibility check)
  * [x] Deduct player worker token (includes validation and eligibility check)
* [ ] Contribute the projects *[T]*
  * [x] basic play function
* [ ] Goal cards

#### Unit tests

* [ ] Find a proper game-flows and integration tests btw different game states *[T]*
  * [ ] Survey boardgame.io unit tests use cases
  * [ ] Find solution and proposal

#### User Interface / User Experience

* [x] Design UI flow scratch
  * references as follows
  * [stone age](https://boardgamearena.com/gamepanel?game=stoneage)
  * [pandemic](https://boardgamearena.com/gamepanel?game=pandemic)
  * [agricola](https://boardgamearena.com/gamepanel?game=agricola)
* [x] Decide Styling tools

  Note: Principle component guildline is fully decouple the styling component with layout components.
  eg. ProjectCard (layout logic) depends on Card (Component with styles)

  * Tailwind: We would love to try new things (Fancier :rocket:)
  * Styled component: We would love to try new things (Classic :tada:)
  * SASS: Old school
  * ~~Material UI~~
  * ~~Boostrap~~

  Highly customised is our two project directions so Material UI and Bootstrap are not fit in our roadmap
* [x] Design client folder structure
  1. feature + style
  * src/
    * features/
      * ResourceCard/
        * ?styled.jsx
      * ProjectCard
      * GoalCard
      * EventCard
    * styled/
      * CardVertical
      * CardHorizontal
      * ?ResourceCard.styled.jsx

  2. feature
  * src/
    * features/
      * ResourceCard/
        * ResourceCard.jsx
        * ResourceCard.styled.jsx
      * ProjectCard/
        * ProjectCard.jsx
        * ProjectCard.styled.jsx
      * GoalCard/
      * EventCard/

  Folders should be structured by features (scenario 2) but it is viable to have common styled components such as Button, Tab, or Input collected in the common folder (styled foder in scenario 1).
* [ ] Table   *[T]*
  * [ ] Table Layout
  * [ ] Projct Card (read)
* [ ] Play Project cards
* [ ] Play Job cards
* [ ] Contribute the projects

### Advanced game logics

* [ ] Play Force cards
* [ ] Event cards

### Expansions (TBD)
