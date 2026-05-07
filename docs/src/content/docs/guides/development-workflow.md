---
title: Development Workflow
description: Day-to-day commands for running, testing, and shipping Weather Starter.
---

All commands run from the repository root and dispatch into the appropriate workspace.

## Common commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the backend + Vite middleware via Portless |
| `npm run build` | Build frontend (`vite build`) and compile backend (`tsc`) |
| `npm run start` | Run the compiled backend (`backend/dist/server.js`) |
| `npm run doctor` | Hit `/health` and `/api/locations` to verify the stack |
| `npm run reset` | Delete the SQLite database files |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | ESLint across the repo |
| `npm run format` | Prettier write across the repo |
| `npm run db:generate` | Generate a Drizzle migration from `backend/src/schema.ts` |
| `npm run db:migrate` | Apply pending Drizzle migrations |
| `npm run docs` | Start the Astro Starlight docs dev server |

## Editing the backend

Backend code lives in `backend/src/`. The dev server uses `tsx watch`, so saved changes restart the process automatically.

Add a route by extending [`backend/src/routes/locations.ts`](https://github.com/) or registering a new router in [`backend/src/server.ts`](https://github.com/).

## Editing the frontend

Frontend code lives in `frontend/src/`. Vite is mounted as Express middleware in development, so the same dev URL serves both API and UI. HMR works without any extra ports.

## Editing the database

1. Edit table definitions in [`backend/src/schema.ts`](https://github.com/).
2. Run `npm run db:generate` to produce a new SQL migration under `backend/drizzle/`.
3. Run `npm run db:migrate` (or restart the dev server — migrations run on startup).

## Tests

Vitest picks up `*.test.ts` files inside `backend/src/`. The test runner sets `NODE_ENV=test`, which silences logging via [`backend/src/logger.ts`](https://github.com/).

## Logging

Backend logs use Pino. By default they stream to stdout and `backend/logs/app.log` (override with `LOG_FILE_PATH`). Frontend interaction events POST to `/api/logs` and are flushed through the same logger.
