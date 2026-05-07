---
title: Backend REST API
description: HTTP routes exposed by the Weather Starter Express server.
---

All routes are JSON. The server is mounted at the dev URL `http://weather-starter.localhost:1355`. The locations router is registered under `/api/locations` in [`backend/src/routes/locations.ts`](https://github.com/).

## Health

### `GET /health`

Liveness probe.

```json
{ "status": "healthy" }
```

## Locations

### `GET /api/locations`

List all stored locations and their most recent weather snapshot.

**Response 200**

```json
{ "locations": [LocationRecord, ...] }
```

### `POST /api/locations`

Create a new location. The server validates that coordinates fall within Singapore (latitude `1.1`–`1.5`, longitude `103.6`–`104.1`), then immediately calls `SingaporeWeatherClient.getCurrentWeather()` and stores the snapshot.

**Request body**

```json
{ "latitude": 1.3521, "longitude": 103.8198 }
```

**Response 201**

```json
{ "location": LocationRecord }
```

**Errors**

- `400` — invalid coordinates or out of bounds
- `409` — location with that latitude/longitude already exists
- `502` — upstream data.gov.sg fetch failed

### `GET /api/locations/:locationId`

Fetch a single location.

**Response 200**

```json
{ "location": LocationRecord }
```

**Errors**

- `404` — location not found

### `POST /api/locations/:locationId/refresh`

Re-fetch from data.gov.sg and overwrite the snapshot columns on the existing row.

**Response 200**

```json
{ "location": LocationRecord }
```

### `DELETE /api/locations/:locationId`

Delete a location. Returns no body.

**Response 204**

## Logs

### `POST /api/logs`

Frontend interaction events are forwarded here and written through Pino.

**Request body**

```json
{ "event": "location.add", "metadata": { "...": "..." } }
```

The `event` field is validated against `^[a-z][a-z0-9_.:-]{1,63}$`.

**Response 204**

## `LocationRecord` shape

The full record returned by every locations endpoint:

```ts
type LocationRecord = {
  id: number;
  latitude: number;
  longitude: number;
  created_at: string; // ISO timestamp
  weather: WeatherSnapshot;
};

type WeatherSnapshot = {
  condition: string | null;
  observed_at: string | null;
  source: string | null;
  area: string | null;
  valid_period_text: string | null;
  temperature_c: number | null;
  humidity_percent: number | null;
  rainfall_mm: number | null;
  wind_speed_knots: number | null;
  wind_direction_degrees: number | null;
  forecast_low_c: number | null;
  forecast_high_c: number | null;
  uv_index: number | null;
  psi_twenty_four_hourly: number | null;
  pm25_one_hourly: number | null;
  air_quality_region: string | null;
  forecast_periods: ForecastPeriod[];
  daily_forecast: DailyForecast[];
};
```

See [`frontend/src/types.ts`](https://github.com/) for `ForecastPeriod` and `DailyForecast`.
