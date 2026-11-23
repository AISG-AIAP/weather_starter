# Rate limits

The realtime endpoints (`/v2/real-time/api/*`) allow 6 calls per 10 s with no API key. The client stays inside that budget in three layers, all in `backend/src/weather.ts`:

1. **Per-endpoint TTL cache** in `fetchJson`, shared by all locations. TTLs are in `CACHE_TTL_MS`. Concurrent requests share one in-flight promise (single-flight). If an endpoint fails and a cached payload exists, the stale payload is returned (stale-if-error).
2. **Sliding-window limiter** `acquireRealtimeSlot()`. It applies only to URLs under the realtime base URL. `REALTIME_WINDOW_MS` is 10_500 rather than 10_000, because the provider counted a call at exactly 10.00 s as still inside the window.
3. **Partial results**, described in [architecture.md](architecture.md).

Things to know before changing this:
- The 4-day forecast is on `api.data.gov.sg`, not the realtime host. It bypasses the limiter.
- The limiter ignores `WEATHER_API_KEY` tiers (12 for dev, 30 for prod). The cap stays at 6 even when a key is set.
- A cold refresh of every field takes about 11 s. This is expected.
- Any new realtime endpoint uses the same 6-call budget.
