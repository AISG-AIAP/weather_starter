---
title: Architecture
description: How the Weather Starter backend, frontend, database, and external APIs fit together.
---

Weather Starter is a single-process Node.js app. Express serves the REST API; Vite is mounted as middleware in development so React assets stream from the same origin. SQLite (via Drizzle) is the system of record for locations and the most recent weather snapshot per location. Live data comes from Singapore's public data.gov.sg APIs.

## System overview

```mermaid
flowchart LR
    Browser["Browser<br/>(React + Tailwind + Leaflet)"]
    Portless["Portless<br/>weather-starter.localhost:1355"]
    Express["Express server<br/>backend/src/server.ts"]
    Vite["Vite middleware<br/>(dev only)"]
    Routes["/api/locations router<br/>backend/src/routes/locations.ts"]
    Logs["/api/logs"]
    Health["/health"]
    DB[("SQLite<br/>backend/weather.db")]
    Weather["SingaporeWeatherClient<br/>backend/src/weather.ts"]
    Gov["data.gov.sg<br/>real-time + forecast APIs"]

    Browser -->|"HTTP"| Portless
    Portless --> Express
    Express --> Vite
    Express --> Routes
    Express --> Logs
    Express --> Health
    Routes -->|"Drizzle ORM"| DB
    Routes --> Weather
    Weather -->|"fetch"| Gov
```

In production, Vite is replaced by static asset serving from the frontend build output, and Portless is bypassed in favor of `PORT`.

## Process model

The dev server is a single Node process driven by `scripts/dev.mjs`:

```mermaid
flowchart TB
    Dev["scripts/dev.mjs"]
    Portless["portless run<br/>--name weather-starter"]
    Tsx["tsx watch<br/>backend/src/server.ts"]
    App["Express app<br/>(API + Vite middleware)"]

    Dev --> Portless --> Tsx --> App
```

`tsx watch` reloads the server on any file change under `backend/src/`. Vite handles HMR for the frontend independently.

## Adding a location

Adding a location triggers an immediate fetch from data.gov.sg. The response is normalized and stored as a snapshot alongside the location row.

```mermaid
sequenceDiagram
    participant UI as React UI
    participant API as Express /api/locations
    participant W as SingaporeWeatherClient
    participant Gov as data.gov.sg
    participant DB as SQLite (Drizzle)

    UI->>API: POST /api/locations { latitude, longitude }
    API->>API: validate Singapore bounds<br/>(lat 1.1–1.5, lon 103.6–104.1)
    API->>W: getCurrentWeather(lat, lon)
    par Parallel fetches
        W->>Gov: 2-hr forecast + area metadata
        W->>Gov: temperature / humidity / rainfall
        W->>Gov: wind speed / direction
        W->>Gov: UV / PSI / PM2.5
        W->>Gov: 24-hr + 4-day forecast
    end
    Gov-->>W: raw readings
    W-->>API: WeatherSnapshot (nearest area + station)
    API->>DB: INSERT location + snapshot columns
    DB-->>API: LocationRecord
    API-->>UI: 201 { location }
    UI->>UI: select new location, render Hero
```

## Refreshing weather

`POST /api/locations/:id/refresh` re-runs the same client and updates the existing row's snapshot columns — no new row is created.

## Frontend composition

The UI is a two-pane layout. State lives in a single React Context (`useStore`) that owns the location list, the selected ID, and pending operations.

```mermaid
flowchart LR
    App["App<br/>frontend/src/App.tsx"]
    Theme["ThemeProvider"]
    Store["StoreProvider<br/>frontend/src/state/store.tsx"]
    Layout["Layout"]
    Sidebar["Sidebar<br/>+ AddLocationForm<br/>+ SidebarCard list"]
    Hero["Hero"]
    Hourly["HourlyStrip"]
    TenDay["TenDayForecast"]
    Tiles["TileGrid"]
    Map["WeatherMapCard<br/>(Leaflet)"]
    API["api.ts<br/>fetch wrapper"]
    Backend["/api/* endpoints"]

    App --> Theme --> Store --> Layout
    Layout --> Sidebar
    Layout --> Hero
    Hero --> Hourly
    Hero --> TenDay
    Hero --> Tiles
    Hero --> Map
    Store -.->|"create / refresh / remove / list"| API
    API --> Backend
```

On mount, `StoreProvider` calls `listLocations()` and auto-selects the first one if no selection exists.

## External dependencies

- `https://api-open.data.gov.sg/v2/real-time/api/...` — modern v2 endpoints for forecasts, temperature, humidity, rainfall, wind, UV, PSI, and PM2.5.
- `https://api.data.gov.sg/v1/environment/4-day-weather-forecast` — legacy v1 endpoint for the 4-day outlook.

Set `WEATHER_API_KEY` to authenticate requests against tighter rate limits.
