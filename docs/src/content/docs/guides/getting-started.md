---
title: Getting Started
description: Install Weather Starter, run the dev server, and verify the stack.
---

Weather Starter is an npm workspaces monorepo with three workspaces: `backend`, `frontend`, and `docs`. The dev server runs the Express backend with Vite mounted as middleware, behind a Portless named URL.

## Prerequisites

- Node.js (use `mise install` if a `.mise.toml` is present)
- npm 10+

## Install

```bash
npm install
```

This installs dependencies for every workspace.

## Run the dev server

```bash
npm run dev
```

This invokes [`scripts/dev.mjs`](https://github.com/), which spawns:

```
portless run --name weather-starter tsx watch backend/src/server.ts
```

The app is then served at:

```
http://weather-starter.localhost:1355
```

The internal backend port is `3000` by default. Override the public port with `PORTLESS_PORT`.

## Verify the stack

With the dev server running:

```bash
WEATHER_STARTER_URL=http://weather-starter.localhost:1355 npm run doctor
```

`npm run doctor` hits `/health` and `/api/locations` and prints a success message if both respond.

## Database

The SQLite database lives at `backend/weather.db` (override with `DATABASE_PATH`). Drizzle migrations run automatically on startup. To regenerate after schema changes:

```bash
npm run db:generate    # generate a new migration from backend/src/schema.ts
npm run db:migrate     # apply pending migrations
```

To wipe the database:

```bash
npm run reset
```

## Production build

```bash
npm run build      # compile backend TypeScript + build frontend with Vite
npm run start      # run dist/server.js on PORT (default 3000)
```
