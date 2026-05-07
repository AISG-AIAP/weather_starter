---
title: Scripts
description: What each entry in package.json scripts actually does.
---

Helper scripts live in `scripts/` and are invoked through the root `package.json`.

## `npm run dev` — `scripts/dev.mjs`

Spawns:

```
portless run --name weather-starter tsx watch backend/src/server.ts
```

`tsx watch` reloads on every backend source change. Vite is initialized inside Express, so the dev URL serves both API and frontend assets.

Environment:

- `PORTLESS_PORT` — public port (default `1355`)
- `PORTLESS_HTTPS` — set to enable HTTPS

## `npm run start` — `scripts/start.mjs`

Runs the compiled output:

```
node backend/dist/server.js
```

Sets `NODE_ENV=production`. Requires a prior `npm run build`.

## `npm run doctor` — `scripts/doctor.mjs`

Health check that fetches `/health` and `/api/locations` against `WEATHER_STARTER_URL` (default `http://127.0.0.1:3000`). Prints a success message if both respond.

```bash
WEATHER_STARTER_URL=http://weather-starter.localhost:1355 npm run doctor
```

## `npm run reset` — `scripts/reset.mjs`

Deletes the SQLite database and its WAL/SHM siblings:

```
weather.db
weather.db-shm
weather.db-wal
```

Resolves the path from `DATABASE_PATH` or the default location under `backend/`.

## Build, test, lint

| Command | Behavior |
| --- | --- |
| `npm run build` | `npm run build -w frontend` then `tsc -p backend/tsconfig.json` |
| `npm test` | `vitest run` (with `NODE_OPTIONS=--disable-warning=ExperimentalWarning`) |
| `npm run test:watch` | `vitest` watch mode |
| `npm run lint` | `eslint .` |
| `npm run format` | `prettier --write .` |

## Database

| Command | Behavior |
| --- | --- |
| `npm run db:generate` | `drizzle-kit generate` against `drizzle.config.ts` |
| `npm run db:migrate` | `drizzle-kit migrate` |

## Docs

| Command | Behavior |
| --- | --- |
| `npm run docs` | `npm run dev -w docs` — Astro Starlight dev server |
| `npm run docs:build` | `npm run build -w docs` — static site build |
