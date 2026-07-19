# ⚔️ LevelUP — Solo Leveling System

A high-contrast, RPG-inspired personal productivity web application built with **Next.js 14 (App Router)** and **Turso (SQLite)**. Level up your real-life skills, build daily habit streaks, earn experience points (XP), and unlock higher Hunter Ranks!

![Solo Leveling System Banner](https://img.shields.io/badge/System-Online-22d3ee?style=for-the-badge&logo=react)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2-4f8ef7?style=for-the-badge&logo=nextdotjs)
![Turso SQLite](https://img.shields.io/badge/Database-Turso%2FSQLite-7c3aed?style=for-the-badge&logo=sqlite)

---

## ✨ Features

- **🎮 RPG System Theme**: High-contrast obsidian glassmorphic interface inspired by *Solo Leveling*, featuring electric blue, cyan, and violet glows, Google Fonts (`Orbitron`, `Rajdhani`), and animated rank badges.
- **⚡ XP & Leveling Engine**:
  - **Base XP Weights**: Routine (10 XP), Normal (25 XP), Important (50 XP), Critical (100 XP).
  - **Habit Streak Multipliers**: Up to **2.0x** XP multiplier for 30+ day consecutive habit streaks.
  - **Category Level Formula**: `Level = Math.floor(Math.sqrt(Total Category XP / 50))`.
  - **Hunter Ranks**: Progress from **E-Rank Awakened** up to **SS-Rank Shadow Sovereign** based on total aggregate XP.
- **🔥 Streak Enforcement & Penalty Job**:
  - Missed habits break your streak back to 0.
  - Penalized **-50% of the task's base XP** (capped at max -100 XP).
  - Scheduled daily via **Vercel Cron** (`/api/cron/penalty` at 01:00 AM) or triggered manually in UI.
- **🎉 Level Up System Notifications**: Full-screen glowing modal dialogue with confetti explosions upon leveling up a skill domain.
- **📊 Real-time Analytics & Audit Log**:
  - Interactive **Recharts** daily XP activity graph.
  - Complete transparent ledger feed tracking every positive/negative XP transaction.

---

## 🛠️ Stack

- **Frontend & Backend**: Next.js 14 (App Router, Server Actions, Route Handlers)
- **Styling**: Tailwind CSS, Lucide Icons, Custom CSS Glows
- **Database**: Turso Cloud / SQLite via `@libsql/client` (supports local `sqllocal.db` fallback)
- **Animations & Visuals**: Framer Motion, `canvas-confetti`, Recharts
- **Deployment**: Vercel (with Vercel Cron configuration in `vercel.json`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- npm or yarn

### 2. Installation & Setup

```bash
# Clone or navigate into the repository
cd LevelUP

# Install dependencies
npm install

# Run database migration & seed initial categories
npm run migrate
```

### 3. Environment Variables (Optional for Turso Cloud)

By default, the app automatically creates a local SQLite database (`sqllocal.db`). To connect to a cloud Turso database, create a `.env.local` file:

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view your System Interface!

---

## 📄 Pages / Navigation

- `/` — **Daily Quests Dashboard**: Habit checklist with live progress indicator, priority tasks, and inline `+XP` gain animations.
- `/stats` — **System Stats**: Skill domain level progress bars, active streak leaderboards, and daily XP graph.
- `/tasks` — **Quest Management**: Add, edit, archive, and filter tasks across categories.
- `/categories` — **Skill Domains**: Category levels, total category XP, and custom domain creation.
- `/log` — **XP Audit Log**: System ledger feed recording earned XP and penalties.

---

## ⏰ Cron Penalty Enforcement

Daily habit penalties are executed automatically via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/penalty",
      "schedule": "0 1 * * *"
    }
  ]
}
```

You can also trigger a manual streak audit at any time using the **"Run Audit"** button in the top navigation bar.

---

## 📜 License

MIT License — Feel free to customize your own System Interface!
