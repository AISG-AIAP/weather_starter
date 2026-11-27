# Architecture

**One process in development.** `backend/src/server.ts` exports `createApp`. It mounts `/api` from `routes/locations.ts`. Outside production it also mounts Vite middleware, so the React app runs in the same process. In production it serves `frontend/dist`.

**Snapshot storage.** Locations are stored in SQLite (`backend/weather.db`, WAL mode) through Drizzle on `node:sqlite` (`db.ts`). Each row holds the latest snapshot as flat columns, plus two JSON columns: `forecast_periods` and `daily_forecast`. Weather is fetched when a location is created and when the user refreshes it. It is not fetched on page load. `db.ts` runs the migrations in `backend/drizzle` at import time. After changing `schema.ts`, run `npm run db:generate` and do not edit the generated SQL.

**Weather client** (`backend/src/weather.ts`). The data.gov.sg payloads are island-wide, not per location. `getCurrentWeather(lat, lon, previous?)` works like this:
1. It fetches the two-hour forecast first. This is required.
2. It fetches the other endpoints in parallel through `settle()`, which turns each failure into `null`.
3. It picks each field client-side from the nearest station, area, or region.
4. A failed field keeps its value from `previous`.

Only a failure of the two-hour forecast throws `WeatherProviderError`, which the refresh route maps to HTTP 502. See [rate-limits.md](rate-limits.md) for the caching and limiting around these calls.

**Routes.** `routes/locations.ts` depends on a `WeatherClient` interface, passed in through `createLocationsRouter({ weatherClient })`. Tests use this to inject fakes. On create, a provider failure still returns 201 with the placeholder location. On delete, a missing location returns 404.

**Frontend.** `frontend/src/state/store.tsx` is the only module that calls `api.ts`. It holds the locations, the selection, and the per-location refreshing and deleting flags. Components in `components/` read from the store and do not fetch. Shared types live in `frontend/src/types.ts`. Requests use relative `/api` paths.
