---
title: Configuration
description: Environment variables and config files used by Weather Starter.
---

Environment variables are read at startup. Defaults work for local development; `.env.example` lists the supported keys.

## Backend env vars

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Internal Express port |
| `NODE_ENV` | unset | `production` enables compiled-mode behavior; `test` silences logging |
| `DATABASE_PATH` | `backend/weather.db` | SQLite file location |
| `WEATHER_API_KEY` | unset | Optional data.gov.sg API key for higher rate limits |
| `LOG_LEVEL` | `info` | Pino log level |
| `LOG_FILE_PATH` | `backend/logs/app.log` | Log file destination (in addition to stdout) |

## Dev server env vars

Read by `scripts/dev.mjs`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORTLESS_PORT` | `1355` | Public port for `weather-starter.localhost` |
| `PORTLESS_HTTPS` | unset | Enable HTTPS via Portless when set |

## Doctor env vars

Read by `scripts/doctor.mjs`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `WEATHER_STARTER_URL` | `http://127.0.0.1:3000` | URL the health check targets |

## Config files

| File | Purpose |
| --- | --- |
| [`drizzle.config.ts`](https://github.com/) | Drizzle Kit config — points at `backend/src/schema.ts` and `backend/drizzle/` |
| [`vitest.config.ts`](https://github.com/) | Vitest config |
| [`eslint.config.js`](https://github.com/) | Flat-config ESLint setup with TypeScript and React rules |
| [`.prettierrc.json`](https://github.com/) | Prettier formatter |
| `backend/tsconfig.json` | Backend TS compile target |
| `frontend/tsconfig.json` | Frontend TS / JSX target |
| `frontend/vite.config.ts` | Vite + React plugin config |
| `frontend/tailwind.config.js` | Tailwind theme + content globs |
