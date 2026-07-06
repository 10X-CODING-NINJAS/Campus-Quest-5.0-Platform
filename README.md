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
| ORM | Prisma 6 + PostgreSQL 16 |
| Queue | BullMQ + Redis 7 |
| Judge | Docker-based isolated execution |
| Monorepo | Turborepo |

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker Desktop (for PostgreSQL + Redis)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 3. Set up environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/electron/.env.example apps/electron/.env
cp apps/admin/.env.example apps/admin/.env

# 4. Run database migrations
npm run db:migrate

# 5. Seed the database
npm run db:seed

# 6. Start all apps in dev mode
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
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database with initial data |

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
