# 🕸 Campus Quest 5.0 — Complete From-Scratch Deployment Guide

This guide provides complete, step-by-step instructions for deploying and running **Campus Quest 5.0** across all subsystems: **PostgreSQL Database**, **Fastify Backend**, **Admin Dashboard**, and the **Electron Desktop Client**.

---

## 📋 Platform Architecture

```
                               ┌────────────────────────────────┐
                               │     Admin Dashboard (Vite)     │
                               └───────────────┬────────────────┘
                                               │ (REST API & Socket.IO)
                                               ▼
┌───────────────────────┐             ┌─────────────────┐             ┌────────────────────────┐
│  Electron Desktop App │ ──────────► │ Fastify Backend │ ──────────► │  PostgreSQL Database   │
│   (Contestant Client) │  Socket.IO  │   & Judge Engine│   Drizzle   │   (Railway / Cloud)    │
└───────────────────────┘             └─────────────────┘             └────────────────────────┘
```

---

## 🗄️ Phase 1: Database Setup (PostgreSQL & Railway)

Campus Quest 5.0 relies on PostgreSQL for persistent storage of team credentials, live contest state, powerup logs, submissions, and help requests.

### Option A: Railway Cloud PostgreSQL (Recommended for Contest)

1. **Provision Database on Railway**:
   - Go to [Railway.app](https://railway.app) and create a new project.
   - Click **+ New** -> **Database** -> **Add PostgreSQL**.
   - Copy your **PostgreSQL Connection URL** from the database settings page.
   - *Example Connection URL*:
     ```env
     DATABASE_URL="postgresql://postgres:GZlLIzYZldxmSKChqEQwtkBlatBboVjk@postgres.railway.internal:5432/railway"
     ```

2. **Push Database Schema**:
   From your local workspace, push the Drizzle schema to your live database:
   ```bash
   # Set your DATABASE_URL in environment or apps/backend/.env
   export DATABASE_URL="postgresql://postgres:...@postgres.railway.internal:5432/railway"

   # Run schema migration from workspace root:
   npx drizzle-kit push --config=apps/backend/drizzle.config.ts
   ```

### Option B: Local PostgreSQL (Development & Testing)

1. **Start Docker Postgres Container**:
   ```bash
   docker run --name campus-quest-db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=campus_quest \
     -p 5432:5432 -d postgres:16-alpine
   ```

2. **Push Schema to Local Postgres**:
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campus_quest"
   npx drizzle-kit push --config=apps/backend/drizzle.config.ts
   ```

---

## 🚀 Phase 2: Fastify Backend & Judge Deployment

The Fastify backend handles user authentication, contest timer synchronization, real-time Socket.IO broadcasts, powerup processing, and code compilation/execution for **C**, **C++**, **Python**, and **Java**.

### Option A: Railway Cloud Deployment (Docker)

1. **Create Railway Service**:
   - In your Railway project, click **+ New** -> **GitHub Repo** -> select `Campus-Quest-5.0-Platform`.
   - Set the Root Directory to `/` or `apps/backend`.

2. **Configure Environment Variables**:
   In Railway Service Settings -> **Variables**, add:
   | Variable Name | Example Value | Description |
   |---------------|---------------|-------------|
   | `PORT` | `3001` | Backend HTTP & WebSocket Port |
   | `HOST` | `0.0.0.0` | Bind host address |
   | `DATABASE_URL` | `postgresql://...` | Connection string to Railway Postgres |
   | `ADMIN_SECRET` | `spidey_admin_2024` | Secret key for Admin Console access |
   | `JWT_SECRET` | `campus_quest_jwt_secret_key_2024` | Token signing secret |
   | `DEMO_MODE` | `false` | Set to `true` ONLY for presentation demo |

3. **Deploy Docker Container**:
   Railway will automatically detect `apps/backend/Dockerfile`. The Dockerfile installs:
   - `gcc` (C compiler)
   - `g++` (C++ compiler)
   - `python3` (Python interpreter)
   - `default-jdk` / `default-jre` (Java compiler & runtime)

4. **Verify Deployment**:
   After build completes, open `https://<your-railway-backend-url>/admin/contest-status` in your browser. It should return `{"status":"NOT_STARTED"}`.

### Option B: Local Backend Execution

1. **Install Dependencies & Compilers**:
   Ensure local system has `gcc`, `g++`, `python3`, and `javac` installed.

2. **Run Local Dev Server**:
   ```bash
   # From repository root:
   npm run dev --filter=@campus-quest/backend
   ```
   Server will start on `http://localhost:3001`.

---

## 🖥️ Phase 3: Admin Console Setup & Deployment

The Admin Console (`apps/admin`) is a React SPA built with Vite and TailwindCSS for contest organizers.

### Option A: Hosting Admin Dashboard (Vercel / Netlify / Railway)

1. **Environment Variable Configuration**:
   In `apps/admin/.env` (or project build settings):
   ```env
   VITE_API_URL="https://your-backend.up.railway.app"
   ```

2. **Build Production Bundle**:
   ```bash
   npm run build --filter=@campus-quest/admin
   ```
   Output files will be generated in `apps/admin/dist`.

3. **Deploy Build Output**:
   Deploy the `apps/admin/dist` static folder to Vercel, Netlify, or Railway Static Service.

### Option B: Local Admin Dashboard Execution

```bash
# From repository root:
npm run dev --filter=@campus-quest/admin
```
Open `http://localhost:5174` in browser.

### Admin Authentication Steps:
1. Open the Admin Console.
2. Enter the `ADMIN_SECRET` (default: `spidey_admin_2024`).
3. Click **Connect to Console**.
4. Access live monitoring, **Tactical Assistance (Spider-Comms Queue)**, scoreboard, and contest controls.

---

## ⚡ Phase 4: Electron Desktop Client Packaging (Contestant Client)

The Electron Desktop client (`apps/electron`) is deployed onto contestant laptops. It includes a built-in local judge fallback installer script and anti-cheat window isolation.

### 1. Configure Client Environment (`apps/electron/src/renderer/lib/socket.ts`)
Set the backend connection URL to point to your live backend server:
```ts
export const API_BASE = 'https://your-backend.up.railway.app'; // or http://localhost:3001
```

### 2. Build Mac & Windows Installers

```bash
# Build desktop packages (macOS .dmg x64 & arm64) from repository root:
npm run build --filter=@campus-quest/electron
```
The output installer packages will be placed in:
- `apps/electron/release/1.0.0/Campus Quest 5.0-1.0.0.dmg` (Intel Mac)
- `apps/electron/release/1.0.0/Campus Quest 5.0-1.0.0-arm64.dmg` (Apple Silicon Mac)

---

## 🧪 Phase 5: End-to-End Verification & Dry Run Checklist

Execute this verification sequence prior to starting the official contest:

1. **Database Audit**:
   ```bash
   npx drizzle-kit push --config=apps/backend/drizzle.config.ts
   ```
   Verify 0 table migration errors.

2. **Backend Seed Verification**:
   The backend automatically seeds pre-configured demo/test teams (`spider@test.cq`, `iron@test.cq`, `web@test.cq`, `quantum@test.cq`) on first boot.

3. **Contest Launch Sequence**:
   - Organizers log into Admin Console (`http://localhost:5174` or live URL).
   - Contestants launch **Campus Quest 5.0** desktop app and log in with team credentials.
   - Admin clicks **Start Contest**. All contestant clients will immediately transition from *WAITING FOR ADMIN* to active coding mode.

4. **Powerup Verification**:
   - Contestant uses **Spider-Sense** -> Mission bypassed instantly.
   - Contestant uses **Web-Fluid** -> HUD Banner displays 60-second time freeze countdown; timer pauses.
   - Contestant uses **Suit Tech** -> Request pops up in Admin **TACTICAL ASSISTANCE QUEUE**. Admin types hint -> Contestant receives `📡 SPIDER-COMMS Incoming Tactical Intel` overlay.

5. **Dry Run Complete!** Platform is 100% production ready for Campus Quest 5.0.
