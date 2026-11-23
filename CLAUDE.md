# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Singapore weather dashboard: an Express + SQLite backend that stores weather snapshots from data.gov.sg, and a React frontend served by the same process in development.

## Commands

```bash
npm install                 # Installs root, backend, and frontend workspaces
npm run dev                 # Express + Vite through Portless at http://weather-starter.localhost:1355
npm run build               # Builds the frontend, then compiles the backend
npm test                    # Vitest over backend/src/**/*.test.ts
npx vitest run backend/src/weather.test.ts -t "limits realtime calls"   # Single test by name
npm run db:generate         # drizzle-kit generate after editing backend/src/schema.ts
npm run db:migrate          # Apply migrations to backend/weather.db
```

No lint or format script exists, and the repo has no ESLint or Prettier config. Match the surrounding style.

## More detail

- [Architecture](docs/architecture.md): process layout, storage, weather client, routes, frontend store.
- [Rate limits](docs/rate-limits.md): the 6-calls-per-10-s budget and how the client stays inside it. Read before adding any realtime endpoint.
- [Testing](docs/testing.md): the fake data.gov.sg server and the test client settings.
