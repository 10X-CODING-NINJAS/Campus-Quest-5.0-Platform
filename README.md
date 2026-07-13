# Campus Quest 5.0 Platform

> Production-ready competitive programming platform built as an Electron desktop app.

## Architecture

```
apps/
├── electron/          # Electron + React 19 + Vite (desktop app)
├── backend/           # Fastify + Prisma + PostgreSQL + Redis + BullMQ
└── admin/             # Vite + React (admin dashboard, runs in browser)

packages/
├── types/             # Shared TypeScript interfaces and enums
├── shared/            # Shared utilities, constants, Zod schemas
└── ui/                # Shared React component library (shadcn/ui)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Electron 33, React 19, TypeScript, Vite |
| Styling | TailwindCSS 3, shadcn/ui, Framer Motion |
| State | Zustand, TanStack Query |
| Editor | Monaco Editor |
| Realtime | Socket.IO |
| Backend | Fastify 5, Node.js 20+ |
| ORM | Drizzle ORM + PostgreSQL 16 |
| Queue | BullMQ + Redis 7 |
| Judge | Docker-based isolated execution |
| Monorepo | Turborepo |

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker Desktop (active and running on your local device)

## Quick Start / Running Locally

### Step 1: Install Project Dependencies
Run from the root directory of the monorepo to install all workspace dependencies:
```bash
npm install
```

### Step 2: Start Local Services (Docker)
Ensure Docker Desktop is running on your device, then launch the PostgreSQL database and Redis container:
```bash
docker compose up -d
```
*Note: This creates local containers bound to ports `5432` (PostgreSQL) and `6379` (Redis).*

### Step 3: Configure Environment Variables
Copy the template files to your local `.env` files:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/electron/.env.example apps/electron/.env
cp apps/admin/.env.example apps/admin/.env
```
Ensure your local `DATABASE_URL` matches your local PostgreSQL credentials (default is `postgresql://postgres:password@localhost:5432/campus_quest`).

### Step 4: Setup and Seed Database
Generate the tables in your local database schema and seed the initial contest parameters, problems, and teams:
```bash
# Push schema structure directly
npm run db:push --workspace=@campus-quest/backend

# Seed local database
npm run db:seed --workspace=@campus-quest/backend
```

### Step 5: Start Development Mode
You can start all three applications (Backend, Admin UI, Electron App) in parallel using:
```bash
npm run dev
```
npm run dev

# Or start individually:
npm run dev:backend    # Fastify API on :3001
npm run dev:electron   # Electron desktop app
npm run dev:admin      # Admin dashboard on :5174
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start all apps in parallel |
| `npm run build` | Build all apps |
| `npm run typecheck` | TypeScript check across monorepo |
| `npm run lint` | Lint all packages |
| `npm run db:push` | Sync local database schema directly |
| `npm run db:migrate` | Run generated Drizzle SQL migrations |
| `npm run db:studio` | Open Drizzle Studio UI |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:reset` | Safe Drizzle database schema wipe |

## Features

- 🔐 **Auth** — JWT-based team authentication with session persistence
- 🏆 **Contest** — Real-time timer, sequential question unlocking, auto-save
- ✏️ **Editor** — Monaco Editor with VSCode-like experience
- ⚖️ **Judge** — Docker-isolated execution with AC/WA/TLE/MLE/RE/CE verdicts
- 🗺️ **Mission** — Progressive coordinate + riddle reveal system
- 🕷️ **Spider Sense** — 3-charge bypass mechanic with real-time sync
- 📊 **Leaderboard** — Real-time with admin freeze capability
- 🛡️ **Anti-cheat** — Fullscreen enforcement, blur detection, DevTools blocking
- 📡 **Admin** — Full contest control, CRUD problems, broadcast announcements

## Hardening & Safety Systems

### 1. Startup Self-Checks
On launch, the backend executes self-checks:
- Validates that mandatory environment configuration parameters exist.
- Performs a database ping and checks catalog table structures.
- Pings Redis and tests the Docker host daemon container state.
- Scans `src` directories to alert if compiled build files contaminate source folders.

### 2. Dev vs. Production Safety
- **Development**: Disruptive anti-cheat lockout overlays (blur focus, exit fullscreen) are bypassed to prevent developer disruption, while keeping logs active in the terminal console.
- **Production**: Full security mode is enforced (Kiosk mode, strict lockout, 5-strike auto-submission).

### 3. Connection Fault Tolerance
If the backend becomes unreachable, the client halts execution and displays a connection fault screen rather than repeatedly requesting resource-heavy logins.

## Troubleshooting & Common Issues

- **Blank screen on Electron app launch**: Usually indicates a Monaco editor initialization state error. Check console DevTools (`Ctrl+Shift+I` or auto-opened in Dev) to inspect position coords.
- **Stale Build Files Error**: If typescript configuration accidentally emits `.js` files in `src/`, delete them:
  ```bash
  git clean -fdx
  ```
- Detailed Drizzle ORM instructions are documented in [db-migration.md](file:///Users/ishaanupponi/Documents/Campus_Quest_5.0%20Platform/docs/db-migration.md).
