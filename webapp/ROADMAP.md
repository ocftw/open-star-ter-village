# Roadmap

This is the living document capture the current area of focus, and what needs to be done before we are ready to online.

* Areas that need help are marked with *[help needed]*.
* Stuff that team is working on is marked with *[T]*.

## First release

### Host Open Star Ter Village

* [x] serve client build
* [ ] refactor build folder under webapp/build
  * [ ] copy client build
  * [ ] copy server build and host both client pages and api requests
* [ ] deploy to heroku
* [ ] user can see the "click-to-deploy" button on the readme file when landed in the project
  * [ ] user can see the "click-to-deploy" button on the readme file with comprehensive information of the webapp project
  * [ ] As a developer, I would like to understand how the heroku works with Open Star Ter Village webapp project

#### implementation

* [ ] heroku multiple application deployment
* [ ] if true:
  * single subdomain name proxy in heroku
    eg. https://abu-123.heroku.com/ => clientside,
        https://abu-123.heroku.com/api/lobby => serverside:8080,
        https://abu-123.heroku.com/api/ => serverside:8000
  * client side served at one standalone service (nginx, node serve, web bucket) and
  * server side served at another standalone service (deno, ts-node, node)

### Basic game logics

* [ ] Play Project cards
* [ ] Play Job cards
* [ ] Contribute the projects
* [ ] Goal cards

### Advanced game logics

* [ ] Play Force cards
* [ ] Event cards

### Expansions (TBD)
