# Life RPG

A comprehensive life tracking and gamifying web application that combines productivity features with fantasy RPG elements. Track your daily tasks, habits, health, finances, and media consumption while building a fantasy world, collecting characters, and exploring dungeons.

## Tech Stack

### Backend

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Other**: CORS, dotenv

### Frontend

- **Framework**: React 18 with React Router DOM
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom Amber theme
- **UI Components**:
  - Radix UI (Dialog, Select, Popover, Checkbox, Label, Slot)
  - ShadcnUI components (Button, Card, Input, Progress, Sheet)
  - Lucide React icons
- **Maps**: Leaflet & React Leaflet (for character location mapping)
- **Charts**: Recharts (for data visualization)
- **Notifications**: Sonner (toast notifications)
- **Animations**: Anime.js (RPG-style animations on Dungeons and other fantasy pages)
- **HTTP Client**: Axios

## Features

### Dashboard

- Profile card showing Level, XP, Coins, Energy
- User profile editing (name and profile picture upload)
- Quick preview of tasks, habits, and missions
- Real world money tracker (with show/hide toggle)
- Pomodoro timer (25 min focus + 5 min rest)

### Tasks

- **Dailies**: Daily tasks with rewards, one-time completion per day, daily reset
- **Habits**: Habit tracker with streak system, manual recording (+/-)
- **Missions**: Long-term mission objectives
- All tasks support tags, difficulty levels, and CRUD operations

### Tracking

- **Mood**: Mood tracker with 1-5 rating and notes
- **Health**: Track sleep time (1-12 hours) with automatic energy regeneration (1 hour of sleep = 1 energy, max 24 energy)
- **Finance**: Income and expense tracker with budget overview

### Media Management

- Track books, comics, games, movies, TV shows
- Status tracking (backlog, not started, in progress, done)
- External source links
- Filter and export to JSON

### Character Management

- Character cover image
- Real-world map integration (Leaflet) for location pinning
- Support for multiple character types (supporting characters, enemies)
- World map and Japan prefecture views
- Character collection and management

### Fantasy World

- **Resources System**: Track meat, wood, stone, iron, and crystal resources
- **Buildings**: Build and manage various buildings
- **Character Collection**: Collect supporting characters through gacha system
- **Active Characters**: Manage active character roster (max population limit)
- Central hub for accessing all fantasy features

### Dungeons

- Create custom dungeons with multiple stages
- Fight enemies and bosses
- Progress tracking through dungeon stages
- Earn XP and coins by defeating enemies
- Energy-based combat system (1 energy per attack)
- **RPG-style UI & animations (Anime.js)**:
  - Staggered card entrance when dungeons load
  - Battle arena panel with muted background in explore sheet
  - Animated HP bar (smooth width transition on damage)
  - Floating damage popup (-X) on attack
  - Enemy shake on hit, attack button pulse
  - Stage transition overlay (“Stage N”) when changing stages
  - Enemy intro (fade + scale) when switching stages
  - Battle area fade-in when opening explore sheet

### Gacha System

- Pull supporting characters using energy
- Character collection tracking
- Active character management for album features
- Character pool management
- **RPG-style UI & animations (Anime.js)**:
  - “Gacha machine” capsule wrapper with border and muted background
  - Pull sequence: button pulse, machine shake, overlay “Pulling...” while API runs
  - Pulled character card: stagger reveal (image → name → media) with border/ring
  - Collected/active character grid: stagger entrance on load; scale bounce when toggling active
  - Pool detail sheet: stagger list items when sheet opens

### Market

- Exchange resources for coins
- Dynamic exchange rates for different resources
- Resource-to-coin conversion system
- **RPG-style UI & animations (Anime.js)**:
  - Header coins badge with scale-in when user is available
  - Exchange rate cards: stagger entrance on load
  - Exchange card: stagger sections (resource, amount, “You will receive”, button); border and shop styling
  - Exchange button pulse on click; “You will receive” box elastic bounce on successful exchange

### Blacksmith

- Craft weapons with resource and coin costs
- Weapon damage bonus system
- Equip weapons to increase total damage
- Base attack and total damage tracking
- **RPG-style UI & animations (Anime.js)**:
  - Weapon cards: stagger entrance on load; equipped card has ring and shadow
  - Create/Edit weapon dialog: scale-in when open
  - Equip/Unequip: card scale bounce (elastic) on click before API
  - Your Resources grid: stagger entrance for coins and resource items

### Town

- Build and manage various building types
- Building progress tracking using build power (from completed Pomodoro sessions)
- **RPG-style UI & animations (Anime.js)**:
  - Staggered entrance for house and leisure zone cards on load
  - Build confirm dialog scale-in when opening
  - Confirm Build button pulse on click
  - Card scale bounce + “Built” badge fade-in after successful build
  - Build power badge scale-in when user is available

### Album

- Upload and manage photos (consumes 1 energy per upload)
- Tag system for photo organization
- Link photos to active characters
- Photo gallery with filtering capabilities

## Mechanics

- **XP System**: XP required to level up increases by 100 XP per level (Level 0→1: 100 XP, Level 1→2: 200 XP, Level 2→3: 300 XP)
- **Energy System**: Max 24 energy, gained from sleep (1 hour = 1 energy)
  - Energy is consumed for various activities: gacha pulls (1 energy), dungeon attacks (1 energy), photo uploads (1 energy)
- **Rewards**: Tasks and missions give XP and coins based on difficulty. Completed Pomodoro sessions also give XP (default: 10 XP per session, configurable)
- **Punishments**: Habits and skipped dailies can reduce coins
- **Resources**: Collect meat, wood, stone, iron, and crystal through various activities
- **Combat System**: Base attack + weapon damage bonus = total damage
- **Building System**: Buildings require resources and build power to complete. Build power is gained from completed Pomodoro sessions (25 build power per 25-minute session)
- **Character System**: Collect characters through gacha, manage active roster (max population limit)

## Installation

### Prerequisites

- Node.js (v16 or higher recommended)
- MongoDB (running locally or remote instance)
- npm or yarn

### Setup Steps

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies**:

```bash
npm run install-all
```

This will install dependencies for:

- Root package (concurrently for dev scripts)
- Backend package
- Frontend package

3. **Configure environment variables**:

Create a `backend/.env` file (optional, defaults are provided):

```env
MONGODB_URI=mongodb://localhost:27017/liferpg
PORT=5000
```

If you don't create a `.env` file, the app will use:

- MongoDB: `mongodb://localhost:27017/liferpg`
- Port: `5000`

4. **Start MongoDB**:

Make sure MongoDB is running on your system. If using a remote instance, update the `MONGODB_URI` in `backend/.env`.

5. **Start the development servers**:

```bash
npm run dev
```

This will concurrently start:

- **Backend server** on `http://localhost:5000`
- **Frontend dev server** on `http://localhost:3000`

The frontend will automatically proxy API requests to the backend.

## Building for Production

To build and run the application for production from the root directory:

1. **Set production environment variables**:

Create or update `backend/.env` with production values:

```env
MONGODB_URI=your_production_mongodb_uri
PORT=5000
NODE_ENV=production
```

2. **Build the frontend**:

```bash
npm run build
```

This will build the frontend and create a `dist` folder in the `frontend` directory with the optimized production build.

3. **Start the production server**:

```bash
npm start
```

Or with explicit production mode:

```bash
npm run start:prod
```

The backend server will run on `http://localhost:5000` (or the port specified in the `PORT` environment variable) and automatically serve the frontend static files.

**Note**:

- Make sure MongoDB is running and configured before starting the production server.
- The backend is configured to automatically serve the frontend static files in production mode.
- All commands can be run from the root directory without needing to `cd` into backend or frontend folders.

## Project Structure

```
liferpg/
├── backend/
│   ├── models/          # MongoDB models
│   │   ├── User.js      # User profile and stats
│   │   ├── Task.js      # Daily tasks
│   │   ├── Habit.js     # Habits
│   │   ├── Mission.js   # Long-term missions
│   │   ├── Mood.js      # Mood entries
│   │   ├── Health.js    # Health tracking
│   │   ├── Finance.js   # Finance transactions
│   │   ├── Media.js     # Media items (books, games, etc.)
│   │   ├── Character.js # Character collection
│   │   ├── Dungeon.js   # Dungeon definitions
│   │   ├── Weapon.js    # Weapons
│   │   ├── Building.js  # Buildings
│   │   ├── Album.js     # Photo album
│   │   └── Wishlist.js  # Wishlist items
│   ├── routes/          # API route handlers
│   │   ├── user.js
│   │   ├── tasks.js
│   │   ├── habits.js
│   │   ├── missions.js
│   │   ├── mood.js
│   │   ├── health.js
│   │   ├── finance.js
│   │   ├── media.js
│   │   ├── characters.js
│   │   ├── settings.js
│   │   ├── wishlist.js
│   │   ├── dungeons.js
│   │   ├── weapons.js
│   │   ├── buildings.js
│   │   ├── market.js
│   │   ├── gacha.js
│   │   └── album.js
│   ├── server.js        # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── ui/      # ShadcnUI components (button, card, dialog, etc.)
│   │   │   ├── ImageUpload.jsx
│   │   │   └── Layout.jsx
│   │   ├── pages/       # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Trackings.jsx
│   │   │   ├── Media.jsx
│   │   │   ├── Characters.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── FantasyWorld.jsx
│   │   │   ├── Dungeons.jsx
│   │   │   ├── Town.jsx
│   │   │   ├── Blacksmith.jsx
│   │   │   ├── Market.jsx
│   │   │   ├── Gacha.jsx
│   │   │   └── Album.jsx
│   │   ├── contexts/    # React contexts
│   │   │   └── UserContext.jsx
│   │   ├── lib/         # Utilities
│   │   │   ├── api.js      # API client
│   │   │   ├── imageUtils.js
│   │   │   └── utils.js
│   │   ├── App.jsx      # Main app component with routing
│   │   ├── main.jsx     # React entry point
│   │   └── index.css    # Global styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── package.json         # Root package with dev scripts
```

## API Endpoints

All API endpoints are prefixed with `/api`:

- **`/api/user`** - User profile, stats, and XP/level management
- **`/api/tasks`** - Daily tasks (CRUD operations, completion tracking)
- **`/api/habits`** - Habits (CRUD, streak tracking, manual recording)
- **`/api/missions`** - Long-term missions (CRUD, progress tracking)
- **`/api/mood`** - Mood entries (create, read, filter by date)
- **`/api/health`** - Health tracking (sleep tracking with energy regeneration)
- **`/api/finance`** - Finance transactions (income, expenses, budget)
- **`/api/media`** - Media management (books, games, movies, TV shows)
- **`/api/characters`** - Character management (CRUD, location mapping)
- **`/api/settings`** - Settings (export/import data)
- **`/api/wishlist`** - Wishlist management
- **`/api/dungeons`** - Dungeon management and combat system
- **`/api/weapons`** - Weapon crafting, equipping, and management
- **`/api/buildings`** - Building construction and management
- **`/api/market`** - Resource-to-coin exchange
- **`/api/gacha`** - Gacha system for character collection
- **`/api/album`** - Photo album management (upload, tag, link to characters/locations)

All endpoints support standard REST operations (GET, POST, PUT, DELETE) where applicable.

## Development Scripts

### Root Level

- `npm run dev` - Start both backend and frontend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend dev server
- `npm run install-all` - Install dependencies for root, backend, and frontend
- `npm run build` - Build frontend for production
- `npm start` - Start production server (serves both backend API and frontend)
- `npm run start:prod` - Start production server with explicit NODE_ENV=production

### Backend

- `npm run dev` - Start server with watch mode (auto-restart on changes)
- `npm start` - Start server in production mode

### Frontend

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Key Features & Mechanics

### User System

- Single-user system (no authentication required)
- Level and XP progression system
- Energy system (max 24, regenerates from sleep)
- Coin economy for rewards and purchases

### Task Management

- **Dailies**: Reset daily, one-time completion per day
- **Habits**: Streak tracking with manual +/- recording
- **Missions**: Long-term objectives with progress tracking
- All support tags, difficulty levels, and custom rewards/punishments

### Fantasy RPG Elements

- **Dungeons**: Multi-stage dungeons with enemies and bosses
- **Combat**: Energy-based (1 energy per attack), weapon damage bonuses
- **Resources**: Meat, wood, stone, iron, crystal
- **Buildings**: Construct buildings using resources and build power (from completed Pomodoro sessions)
- **Gacha**: Collect characters using energy
- **Album**: Photo management linked to characters and locations

### Data Management

- All data stored in MongoDB
- Image upload support (base64 encoding)
- JSON export/import for backup

## UI/UX

- **Design**: Bento-style grid layout
- **Theme**: Amber color scheme with neutral base colors
- **Components**: Modern UI with Radix UI primitives and ShadcnUI components
- **Icons**: Lucide React icon library
- **Notifications**: Toast notifications via Sonner
- **Responsive**: Mobile-friendly design with Tailwind CSS

## Notes

- Single-user system (no login/authentication required)
- All data is stored locally in MongoDB (default: `mongodb://localhost:27017/liferpg`)
- Image uploads are stored as base64 strings in the database
- Frontend runs on Vite dev server (default port 5173)
- Backend runs on Express server (default port 5000)
- Frontend runs on Vite dev server (port 3000)
- CORS is enabled for development
- Large payload support (50MB limit for JSON/URL-encoded data)
