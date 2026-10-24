# Testing guidance

Read this file when adding behavior or changing routes, persistence, or provider parsing.

Tests live beside backend source as `backend/src/**/*.test.ts`. Vitest runs them in a Node environment with file parallelism disabled.

## Test patterns

- Route tests use Supertest, an isolated temporary SQLite database, and an injected `WeatherClient`.
- Set `DATABASE_PATH` before dynamically importing modules that transitively import `db.ts`.
- Provider tests mock `globalThis.fetch`; they must not call the live data.gov.sg API.
- Restore global mocks after each provider test.

Cover the behavior affected by the change. Relevant cases commonly include route validation and response contracts, DB field mappings, provider response-shape parsing, nearest station or region selection, retry/error handling, and partial provider failures.

Run the narrow test first, then the full checks:

```bash
npm test
npm run build
```
