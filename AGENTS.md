# Open StarTer Village - Development Agent Instructions

## Project Overview

**Open StarTer Village** is an open-source boardgame designed to help beginners understand open-source culture, project collaboration, and the benefits of open-source initiatives. The project consists of three main components:

1. **Physical Board Game** - The original tabletop game
2. **Google Spreadsheet Prototype** - Early digital prototype using Google Apps Script
3. **Web Application** - Modern web-based implementation using Next.js and boardgame.io

### Game Objectives
- Teach open-source culture core values (open definitions, four freedoms)
- Demonstrate open-source advantages and community organization
- Show how to participate in collaborative open-source projects
- Highlight important open-source, open-government, and open-data projects

### Game Specifications
- **Players**: 3-6 players
- **Duration**: ~60 minutes
- **Languages**: Chinese (Traditional) and English

## Repository Structure

```
open-star-ter-village/
├── google-spreadsheet/     # Google Apps Script prototype
├── homepage/              # Official website (Next.js)
├── packages/
│   └── webapp/           # Main web application (Next.js + boardgame.io)
├── package.json          # Root workspace configuration
└── README.md            # Project documentation
```

## Technology Stack

### Root Workspace
- **Package Manager**: Yarn 3.4.1 with workspaces
- **Node Version**: >=18
- **Scripts**: Unified commands for all sub-projects

### Google Spreadsheet Prototype
- **Language**: Google Apps Script (JavaScript)
- **Tools**: @google/clasp for deployment
- **Purpose**: Early prototype and testing

### Homepage
- **Framework**: Next.js 13.2.3
- **Styling**: Custom CSS
- **CMS**: Decap CMS for content management
- **Content**: Markdown files with multilingual support (en/zh-Hant)

### Web Application
- **Frontend**: Next.js 14.2.3 + React 18
- **Game Engine**: boardgame.io 0.50.2
- **State Management**: Redux Toolkit + React Redux
- **UI Framework**: Material-UI (MUI) 5.15.19
- **Language**: TypeScript
- **Architecture**: Client-server with real-time game state

## Development Setup

### Prerequisites
- Node.js >=18
- Yarn 3.4.1
- Git

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/ocftw/open-star-ter-village.git
cd open-star-ter-village

# Install dependencies for all workspaces
yarn install

# Build all projects
yarn all:build
```

### Development Commands

#### All Projects
```bash
# Start development servers for all projects
yarn all:dev

# Build all projects
yarn all:build

# Start production servers
yarn all:start

# Lint all projects
yarn all:lint
```

#### Individual Projects
```bash
# Web Application
yarn webapp dev          # Start development (Next.js + server)
yarn webapp build        # Build for production
yarn webapp start        # Start production server
yarn webapp test         # Run tests

# Homepage
cd homepage
yarn dev                 # Start development server
yarn build              # Build for production
yarn start              # Start production server
yarn lint               # Run linting

# Google Spreadsheet
cd google-spreadsheet
yarn pull               # Pull from Google Apps Script
yarn push               # Push to Google Apps Script
```

## Architecture Details

### Web Application Architecture

The web application uses a modern client-server architecture:

#### Client Side (Next.js)
- **Pages**: React components with TypeScript
- **Components**: Modular UI components using MUI
- **State Management**: Redux for global state, local state for UI
- **Game Integration**: boardgame.io client for game state

#### Server Side
- **Game Server**: Custom server using boardgame.io
- **Real-time Communication**: WebSocket connections
- **Game Logic**: Pure TypeScript game engine

#### Game Engine (boardgame.io)
- **Game State**: Centralized state management
- **Actions**: Player actions and game mechanics
- **Stages**: Game flow control
- **AI**: Optional AI players

### Key Components

#### Game Components
- `BoardGame.tsx` - Main game container
- `Table/` - Game board and project management
- `ActionBoard/` - Player actions and controls
- `UserPanel/` - Player hand and status

#### Game Logic
- `game/core/` - Core game mechanics
- `game/data/` - Game data (cards, events, jobs)
- `game/store/` - State management slices

## Development Guidelines

### Code Style
- **TypeScript**: Strict typing for all new code
- **ESLint**: Follow project linting rules
- **Prettier**: Consistent code formatting
- **Components**: Functional components with hooks

### File Organization
- **Components**: Grouped by feature/domain
- **Types**: Shared types in dedicated files
- **Utils**: Pure functions for utilities
- **Constants**: Game constants and configuration

### Testing Strategy
- **Unit Tests**: Core game logic and utilities
- **Integration Tests**: Component interactions
- **E2E Tests**: Full game flow (future)

### Internationalization
- **Languages**: Chinese (Traditional) and English
- **Content**: Markdown files in `_cards/` and `_pages/`
- **UI**: Translation keys for interface elements

## Contribution Workflow

### Getting Started
1. **Fork** the repository
2. **Create** a feature branch
3. **Set up** development environment
4. **Make** your changes
5. **Test** your changes
6. **Submit** a pull request

### Issue Guidelines
- **Bug Reports**: Include steps to reproduce
- **Feature Requests**: Describe use case and benefits
- **Enhancements**: Link to existing discussions

### Pull Request Guidelines
- **Title**: Clear description of changes
- **Description**: Explain what and why
- **Tests**: Include relevant tests
- **Documentation**: Update docs if needed

## Game Development Focus Areas

### Current Priorities
1. **Core Game Mechanics**: Complete game rule implementation
2. **UI/UX**: Improve player experience
3. **Multiplayer**: Real-time game synchronization
4. **Content**: Expand card library and scenarios

### Future Enhancements
1. **AI Players**: Computer-controlled opponents
2. **Tournaments**: Competitive play features
3. **Analytics**: Game statistics and insights
4. **Mobile**: Responsive design improvements

## Resources and Documentation

### Official Links
- **Website**: https://openstartervillage.ocf.tw/
- **Discord**: https://discord.gg/JnTHGnxwYS
- **Wiki**: https://github.com/ocftw/open-star-ter-village/wiki
- **Issues**: https://github.com/ocftw/open-star-ter-village/issues

### Game Resources
- **Rules**: Google Drive folder with game rules
- **Assets**: Visual materials and game components
- **Educational Kit**: Teaching resources and guides

### Technical Documentation
- **boardgame.io**: https://boardgame.io/
- **Next.js**: https://nextjs.org/docs
- **Material-UI**: https://mui.com/
- **Redux Toolkit**: https://redux-toolkit.js.org/

## Troubleshooting

### Common Issues
1. **Node Version**: Ensure Node.js >=18
2. **Yarn Version**: Use Yarn 3.4.1 (project-specific)
3. **Port Conflicts**: Check for existing servers on ports 3000, 3001
4. **Build Errors**: Clear node_modules and reinstall

### Development Tips
- Use `yarn webapp dev` for full development environment
- Check browser console for client-side errors
- Monitor server logs for backend issues
- Use TypeScript strict mode for better code quality

## License and Legal

- **Game Content**: CC BY 4.0 License
- **Code**: MIT License
- **Contributions**: Must follow project license terms

---

This AGENT.md provides comprehensive guidance for continuing development of the Open StarTer Village project. Follow these instructions to maintain consistency and quality across all components of this open-source boardgame initiative.
