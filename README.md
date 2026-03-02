# Weather Starter

A minimal weather app starter project for agentic coding.

## Background

This starter intentionally keeps app features small while including a real external API integration. The goal is to give students a working baseline they can extend using agent-assisted workflows, practicing around API docs, OpenAPI context, and tooling like Postman MCP.

The app tracks locations in Singapore and fetches weather forecasts from the government's open data API. Weather data is stored as snapshots in SQLite — each refresh overwrites the previous reading for that location.

## Tech Stack

| Layer | Tools |
|-------|-------|
| Backend | Python 3.11, FastAPI, SQLite (built-in sqlite3), httpx |
| Frontend | React 18, Vite, Tailwind CSS |
| External API | Singapore data.gov.sg (`api-open.data.gov.sg`) |
| Dev environment | Flox (manages Node.js + uv) |

## Architecture

```mermaid
flowchart LR
    A["React + Vite Frontend<br/>Port 5173"] -->|"/api requests"| B["FastAPI Backend<br/>Port 8000"]
    B --> C["SQLite<br/>weather.db"]
    B -->|External API| D["data.gov.sg API<br/>api-open.data.gov.sg"]
```

The Vite dev server proxies `/api/*` requests to the FastAPI backend, so the frontend uses relative URLs.

### Database and refresh flow

The app does **not** call the external weather API on every page load. Instead it uses a snapshot pattern:

1. **Creating a location** (`POST /api/locations`) saves the name and coordinates to SQLite with a placeholder weather status ("Not refreshed"). No external API call is made.
2. **Listing locations** (`GET /api/locations`) reads entirely from SQLite — fast, offline-capable, and never hits rate limits.
3. **Refreshing weather** (`POST /api/locations/{id}/refresh`) is the only operation that calls the data.gov.sg API. It fetches the latest forecast, writes the result back to the same row in SQLite, and returns the updated location.

This means the external API is only called when a user explicitly clicks "Refresh". The frontend can load and display data as often as it wants without burning through rate limits, because every read is served from the local database.

## Project Structure

```text
weather-starter/
├── .flox/
│   └── env/
│       └── manifest.toml                # Flox environment + services
├── backend/
│   ├── pyproject.toml
│   ├── uv.lock
│   └── app/
│       ├── main.py                      # FastAPI app + SQLite init
│       ├── routers/
│       │   └── locations.py             # Location CRUD + refresh endpoints
│       └── services/
│           └── weather_api.py           # Singapore weather API client
└── frontend/
    ├── .env.local.example
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── main.jsx                     # React entry point
        ├── App.jsx                      # App wrapper with LocationsProvider
        ├── index.css                    # Tailwind base styles
        ├── api/
        │   ├── client.js               # Base fetch wrapper
        │   └── locations.js            # Location API calls
        ├── hooks/
        │   └── useLocations.jsx        # Context + hooks for location state
        ├── components/
        │   ├── LocationForm.jsx        # Add location form
        │   └── LocationList.jsx        # Location cards + refresh
        └── pages/
            └── Dashboard.jsx           # Main page layout
```

## Quick Start

Install Flox first: [https://flox.dev](https://flox.dev)

Start the Flox environment:

```bash
flox activate
```

Then start services:

```bash
flox services start
```

Open [http://localhost:5173](http://localhost:5173).

Under the hood, `flox services start` runs:

```bash
# Backend (in backend/)
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Frontend (in frontend/)
npm install   # only if node_modules is missing
npm run dev -- --host 127.0.0.1 --port 5173
```

You can run these manually if you need to debug startup issues.

Useful commands:

```bash
flox services status
flox services logs backend
flox services logs frontend
flox services stop
```

Optional:
- Set `WEATHER_API_KEY` as an environment variable if you want to use an API key.
- Change ports in `.flox/env/manifest.toml` (`BACKEND_PORT`, `FRONTEND_PORT`).

## External API Reference

All endpoints are on `https://api-open.data.gov.sg`. No API key is required for basic usage, but you may hit rate limits (HTTP 429) during heavy development.

| Endpoint | Docs | Notes |
|----------|------|-------|
| `GET /v2/real-time/api/two-hr-forecast` | [2-hour Forecast](https://data.gov.sg/datasets/d_3f9e064e25005b0e42969944ccaf2e7a/view) | Already used in this app. Response includes `area_metadata` (location names + coordinates) and forecast conditions per area. |
| `GET /v2/real-time/api/air-temperature` | [Realtime Weather Readings](https://data.gov.sg/collections/realtime-weather-readings/view) | Temperature in Celsius from weather stations. |
| `GET /v2/real-time/api/relative-humidity` | [Realtime Weather Readings](https://data.gov.sg/collections/realtime-weather-readings/view) | Humidity percentage from weather stations. |
| `GET /v2/real-time/api/rainfall` | [Realtime Weather Readings](https://data.gov.sg/collections/realtime-weather-readings/view) | Rainfall in mm from weather stations. |
| `GET /v2/real-time/api/wind-speed` | [Realtime Weather Readings](https://data.gov.sg/collections/realtime-weather-readings/view) | Wind speed in knots from weather stations. |
| `GET /v2/real-time/api/wind-direction` | [Realtime Weather Readings](https://data.gov.sg/collections/realtime-weather-readings/view) | Wind direction in degrees from weather stations. |
| `GET /v1/environment/24-hour-weather-forecast` | [Weather Forecast](https://data.gov.sg/collections/weather-forecast/view) | 24-hour forecast broken into time periods. Different response shape from the 2-hour endpoint. |
| `GET /v1/environment/4-day-weather-forecast` | [Weather Forecast](https://data.gov.sg/collections/weather-forecast/view) | 4-day outlook with temperature ranges and forecast text. |

### API Key (optional)

If you hit rate limits (HTTP 429), you can register for a free API key:

1. Go to [data.gov.sg](https://data.gov.sg) and create an account
2. Navigate to your profile and generate an API key
3. Set the environment variable before starting the backend:
   ```bash
   export WEATHER_API_KEY=your_api_key_here
   ```
4. Restart the backend — the app sends the key as an `x-api-key` header automatically

---

## What Is Implemented

The app currently supports:

- **Add a location** — latitude + longitude, validated (must be within Singapore) and persisted to SQLite
- **List locations** — all tracked locations with their latest weather snapshot
- **Refresh weather** — `POST /api/locations/{id}/refresh` calls the 2-hour forecast API and saves the result
- **Error handling** — duplicate locations (409), missing locations (404), weather API failures (502)

Backend endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/locations` | List all locations |
| `POST` | `/api/locations` | Create a location |
| `GET` | `/api/locations/{id}` | Get a single location |
| `POST` | `/api/locations/{id}/refresh` | Refresh weather for a location |

Frontend components (all styled with Tailwind CSS utility classes in JSX, no component libraries):

| Component | File | Description |
|-----------|------|-------------|
| `Dashboard` | `pages/Dashboard.jsx` | Single page layout. Header with app title, then `LocationForm` and `LocationList` in a centered column. |
| `LocationForm` | `components/LocationForm.jsx` | Form with latitude and longitude inputs. Clears on success, shows errors inline. |
| `LocationList` | `components/LocationList.jsx` | Cards for each saved location showing forecast area as header, condition, valid period, and a "Refresh" button. |

## Feature Tasks

These tasks are ordered from easiest to hardest. Each one builds on the existing codebase and introduces new concepts progressively.

### 1. Delete a location

Add a `DELETE /api/locations/{id}` endpoint and a delete button to each card in `LocationList.jsx`.

| Layer | What to do |
|-------|-----------|
| Backend | New DELETE endpoint in `locations.py` |
| Frontend | Delete button in `LocationList.jsx` |

### 2. Geolocation + auto-detect

"Use my location" button that detects the user's position via the browser, finds the nearest Singapore forecast area, and adds it automatically. Works on `localhost` without HTTPS.

| Layer | What to do |
|-------|-----------|
| Backend | No changes needed (nearest-area matching already exists in `weather_api.py`) |
| Frontend | New button in `LocationForm.jsx` using [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API). Auto-refresh on add. |

### 3. Singapore area picker

Replace the manual lat/lon inputs with a searchable dropdown. The 2-hour forecast response includes `area_metadata` with area names and coordinates — use that to populate the list.

| Layer | What to do |
|-------|-----------|
| Backend | No changes needed |
| Frontend | Replace lat/lon fields in `LocationForm.jsx` with a searchable `<select>` or autocomplete populated from `area_metadata` |
| External API | `GET /v2/real-time/api/two-hr-forecast` → `area_metadata` array |

### 4. Current conditions detail

Show temperature, humidity, and rainfall alongside the forecast condition. All three endpoints share the same response shape — station readings with coordinates.

| Layer | What to do |
|-------|-----------|
| Backend | New methods in `weather_api.py`, new columns in `main.py`, extend the refresh endpoint |
| Frontend | Redesign location cards to show current temp prominently, with humidity and rainfall as secondary details |
| External API | `GET /v2/real-time/api/air-temperature`, `GET /v2/real-time/api/relative-humidity`, `GET /v2/real-time/api/rainfall` |

### 5. Hourly and multi-day forecast

Add a scrollable hourly timeline and a 4-day daily forecast below each location's current conditions. The 24-hour endpoint returns periods (morning, afternoon, night) by region. The 4-day endpoint returns daily high/low temperature ranges and outlook text. Both are `v1` endpoints with different response shapes from the 2-hour API.

| Layer | What to do |
|-------|-----------|
| Backend | New service methods + endpoints (e.g. `GET /api/locations/{id}/forecast`) |
| Frontend | Horizontally scrollable hourly row + vertical daily list, each showing condition icon/text and temperature range |
| External API | `GET /v1/environment/24-hour-weather-forecast`, `GET /v1/environment/4-day-weather-forecast` |

### 6. Wind and atmospheric readings

Add a wind and atmosphere section showing wind speed, direction, and pressure. Display wind as a compass arrow or animated indicator.

| Layer | What to do |
|-------|-----------|
| Backend | New methods in `SingaporeWeatherClient`, extend refresh or add new endpoint |
| Frontend | New `WindCompass` or similar component showing direction + speed visually |
| External API | `GET /v2/real-time/api/wind-speed`, `GET /v2/real-time/api/wind-direction` |

### 7. UI overhaul

Redesign the app layout and styling. Use gradient backgrounds, glassmorphism cards, weather condition icons, and smooth transitions. Aim for a polished, modern look — think translucent panels, large temperature display, and condition-appropriate color themes (blue for rain, warm tones for sun).

| Layer | What to do |
|-------|-----------|
| Backend | No changes needed |
| Frontend | Restyle all existing components with Tailwind. Add weather icons (e.g. [Lucide](https://lucide.dev/) or custom SVGs). Consider animated backgrounds or condition-based themes. |

### 8. Interactive map

Add a full-screen map view of Singapore. Show all saved locations as pins with weather popups. Tapping the map adds a new location. Overlay a rainfall or temperature heatmap layer using station data from Tasks 4/6.

| Layer | What to do |
|-------|-----------|
| Backend | New endpoint to return all station readings as GeoJSON (for heatmap overlay) |
| Frontend | New `WeatherMap` component using [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/). Toggle between map view and list view in `Dashboard.jsx`. |
| NPM packages | `leaflet`, `react-leaflet` |

### 9. Location detail page with charts

Add a detail view for each location. Show historical readings over time as line charts (temperature, rainfall, humidity). Requires storing each refresh as a separate row instead of overwriting.

| Layer | What to do |
|-------|-----------|
| Backend | New `readings` table (one row per refresh). New endpoint for time-series data. |
| Frontend | New detail page/route with charts using [Recharts](https://recharts.org/) or [Chart.js](https://www.chartjs.org/). Add client-side routing with [React Router](https://reactrouter.com/). |
| NPM packages | `react-router-dom`, `recharts` or `chart.js` |

### 10. Multi-location management

Support reordering locations (drag-and-drop or manual up/down), setting a default/primary location, and swiping between locations on mobile. The primary location shows first on launch.

| Layer | What to do |
|-------|-----------|
| Backend | New `position` column for sort order, new endpoint to reorder |
| Frontend | Drag-and-drop with [@dnd-kit](https://dndkit.com/) or similar. Swipeable location cards on mobile. |

