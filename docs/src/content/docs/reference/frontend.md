---
title: Frontend
description: Components, state, and the API client used by the React UI.
---

The frontend is a single-page React app served by Vite. In dev, Vite is mounted as Express middleware, so HMR and API calls share the same origin.

## Entry point

[`frontend/src/main.tsx`](https://github.com/) mounts `<App />` from [`App.tsx`](https://github.com/), which wraps the tree in `ThemeProvider` and `StoreProvider` before rendering `<Layout />`.

## Layout

`Layout` is a two-column flex container:

- **Sidebar** (left, ~22rem) — search, "Add Location" form, scrollable list of `SidebarCard`s.
- **Hero** (right) — primary weather display for the selected location.

## Components

| Component | File | Purpose |
| --- | --- | --- |
| `Sidebar` | [`Sidebar.tsx`](https://github.com/) | Search input, add-form trigger, filtered location list |
| `SidebarCard` | [`SidebarCard.tsx`](https://github.com/) | Individual location card with delete button and selected state |
| `AddLocationForm` | [`AddLocationForm.tsx`](https://github.com/) | Latitude/longitude input form |
| `Hero` | [`Hero.tsx`](https://github.com/) | Header, current temperature, forecasts, refresh control |
| `HourlyStrip` | [`HourlyStrip.tsx`](https://github.com/) | Horizontal scrollable hourly periods |
| `TenDayForecast` | [`TenDayForecast.tsx`](https://github.com/) | Vertical list of daily forecasts |
| `TileGrid` | [`TileGrid.tsx`](https://github.com/) | Humidity, rainfall, wind, UV, air quality tiles |
| `WeatherMapCard` | [`WeatherMapCard.tsx`](https://github.com/) | Leaflet map showing location pins |
| `ThemeSelector` | [`ThemeSelector.tsx`](https://github.com/) | Light / dark / apple theme picker |

Helpers: [`format.ts`](https://github.com/) for `formatTemperature` and `formatTime`; [`icons.tsx`](https://github.com/) for inline SVGs.

## State

Global state lives in [`frontend/src/state/store.tsx`](https://github.com/). It exposes:

```ts
type StoreValue = {
  locations: Location[];
  selectedId: number | null;
  isAdding: boolean;
  isLoading: boolean;
  refreshingId: number | null;
  deletingId: number | null;
  error: string | null;
  select(id: number | null): void;
  setAdding(value: boolean): void;
  create(payload: CreateLocationPayload): Promise<void>;
  refresh(id: number): Promise<void>;
  remove(id: number): Promise<void>;
};
```

Two hooks are exported:

- `useStore()` — full store value.
- `useSelectedLocation()` — convenience for the currently selected `Location`.

On mount, `StoreProvider` calls `listLocations()` and auto-selects the first location if none is selected.

Theme state lives in a separate `ThemeProvider` ([`state/theme.tsx`](https://github.com/)).

## API client

[`frontend/src/api.ts`](https://github.com/) wraps `fetch` and centralizes endpoint paths:

| Function | Method + path |
| --- | --- |
| `listLocations()` | `GET /api/locations` |
| `createLocation(payload)` | `POST /api/locations` |
| `refreshLocation(id)` | `POST /api/locations/:id/refresh` |
| `deleteLocation(id)` | `DELETE /api/locations/:id` |
| `logInteraction(event, metadata)` | `POST /api/logs` |

A generic `request<T>(endpoint, options)` prepends `/api`, sets JSON headers, and throws on non-2xx responses.

## Styling

Tailwind CSS, configured in [`frontend/tailwind.config.js`](https://github.com/) with PostCSS in [`frontend/postcss.config.js`](https://github.com/). The single CSS entry is `frontend/src/index.css`, which imports Tailwind's layers. There is no component library — all components are hand-rolled.
