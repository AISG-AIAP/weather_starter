# Testing

- Tests in `backend/src/**/*.test.ts` run under Vitest with `fileParallelism: false`.
- `weather.test.ts` starts a local `http.createServer` that fakes data.gov.sg. Tests never call the live API. Each test sets `respond` to control the fake's status and body for each path.
- The `client()` helper sets `realtimeCallsPerWindow: 1000`. Any new test that builds a client without this setting will wait on the real 10.5 s window and can time out at Vitest's 5 s default.
- The limiter test uses `realtimeCallsPerWindow: 3` and `realtimeWindowMs: 200` to check that no 200 ms window holds more than 3 calls.
- Route tests in `routes/locations.test.ts` call `createApp({ serveFrontend: false, ... })` with a fake `weatherClient`.
