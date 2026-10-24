# Architecture

Read this file for changes that cross frontend/backend boundaries or alter how the app runs.

## Repository layout

- `backend/`: Express API, Drizzle ORM, SQLite, provider integration, and Vitest tests.
- `frontend/`: React single-page app built by Vite and styled with Tailwind CSS.
- `scripts/`: root development, production, health-check, and database-reset wrappers.
- `backend/drizzle/`: generated and committed SQL migrations.

## Runtime composition

`backend/src/server.ts` is the composition root. It creates Express, mounts health, logging, and API routes, and serves the frontend.

- Development uses Vite middleware inside the Express process.
- Production serves `frontend/dist` and falls back to `index.html` for SPA routes.
- Frontend requests use relative `/api` URLs, so the app does not require a separate development backend or CORS configuration.
- `scripts/dev.mjs` wraps the server with Portless. The browser gets a stable `.localhost` URL while the underlying server port may vary.

## End-to-end data flow

1. `backend/src/server.ts` mounts the locations router at `/api`.
2. `backend/src/routes/locations.ts` validates HTTP input and coordinates database and provider calls.
3. `backend/src/weather.ts` retrieves and normalizes data.gov.sg responses.
4. `backend/src/db.ts` persists the latest snapshot through the schema in `backend/src/schema.ts`.
5. `frontend/src/api.ts` reads the API and passes results to `frontend/src/state/store.tsx`.
6. The store supplies the dashboard components with locations, selection, and mutation state.

Creating a location inserts a placeholder snapshot and then immediately refreshes it. Later refreshes overwrite the latest snapshot; the app does not retain weather history.
