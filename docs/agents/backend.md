# Backend guidance

Read this file when changing Express routes, weather-provider behavior, logging, SQLite persistence, or Drizzle migrations.

## Layer responsibilities

- `server.ts`: middleware, health and frontend-log endpoints, router mounting, frontend serving, and the final error handler.
- `routes/locations.ts`: request validation, HTTP status codes, and orchestration.
- `weather.ts`: provider requests, retries, payload parsing, and nearest station/region/forecast selection.
- `db.ts`: queries and mapping between API-facing snake_case records and Drizzle's camelCase columns.
- `schema.ts`: table definitions and persisted weather-snapshot shape.
- `logger.ts`: structured Pino application logging.

Keep credentials and full third-party payloads out of logs.

## Weather-provider behavior

`SingaporeWeatherClient.getCurrentWeather()` makes independent data.gov.sg calls with `Promise.allSettled`. Preserve partial-result behavior: failure of an optional metric must not discard readings returned by other endpoints.

The external API can be used without a key for light traffic. `WEATHER_API_KEY` adds the `x-api-key` header when configured.

## API behavior

Treat `server.ts` and `routes/locations.ts` as the source of truth for the current endpoint inventory. Location creation accepts only the Singapore coordinate bounds enforced by the router. When changing handlers, preserve their existing response contracts and cover intentional status-code changes in route tests. Provider failures during explicit refresh return `502`; provider failure after creation leaves and returns the newly persisted placeholder location.

## Persistence and migrations

SQLite opens and migrations run when `db.ts` is imported. Tests requiring an isolated database must set `DATABASE_PATH` before dynamically importing `server.ts` or `db.ts`.

When changing persisted snapshot fields, update all of the following:

- `WeatherSnapshot` and the table in `schema.ts`
- `defaultWeather`, `weatherToColumns`, and `rowToRecord` in `db.ts`
- provider output types and assembly in `weather.ts`
- frontend response types
- relevant tests

After editing `backend/src/schema.ts`, run:

```bash
npm run db:generate
npm run db:migrate
```

Inspect and commit the generated files under `backend/drizzle/`. Do not edit generated migration metadata by hand.
