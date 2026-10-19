# Map view design

## Intent and why

Today the right-hand "Hero" panel always shows the selected location's weather
detail (condition, metrics, forecasts). The user wants an interactive map of
Singapore showing every saved location as a pin, with weather data available
in a popup — positioned as a **primary view**, not a small widget, something
people navigate around rather than glance at.

The README already sketched a lighter version of this under "UI overhaul and
theming" (map card with pins and weather labels, expandable to full-screen,
read-only — locations are still added through the existing form). This design
supersedes that sketch where the two differ: the map becomes the Hero's
default view outright rather than a card that expands, since the user chose
"main view" over "quick-glance widget."

## Goals

- All saved locations shown as pins on an interactive Singapore map.
- Map is the default view in the Hero panel.
- A persistent toggle (not tied to any specific pin) switches the Hero panel
  between "Map" and "Details" (the existing detail-cards view). Available
  regardless of which location is selected.
- Clicking a pin selects that location (syncing the Sidebar's highlighted
  card, same `selectedId` the rest of the app already uses) and opens a
  lightweight popup: location name, condition icon, current temperature.
- Pin markers themselves show a condition icon at a glance, without clicking.

## Non-goals

- Marker clustering, dragging, or custom marker placement.
- Adding a location by clicking the map (locations are still added via the
  existing Sidebar form — carried over from the README's original spec).
- A separate full-screen/modal expansion of the map — moot now that the map
  *is* the main view when in "Map" mode.
- Historical data, routing, or any charting on the map.
- Showing live temperature on every pin simultaneously without a click (see
  Constraints — this was explicitly ruled out).

## Anti-goals (would make this a failure even if it technically works)

- Reintroducing the data.gov.sg rate-limit problem fixed earlier this session
  (see the `TtlCache` work in `backend/src/weather.ts`). The map must not fire
  the 9-endpoint enriched-weather fetch for every saved location at once.
- Breaking the existing Sidebar / Details flow. "Details" must look and work
  exactly as it does today — this is additive, not a rewrite.

## Constraints

- `leaflet` and `react-leaflet` are already installed
  (`frontend/package.json`) and unused — use them rather than evaluating
  alternatives.
- Backend: **no changes.** The existing `GET /api/locations` (cheap, condition
  only) and `GET /api/locations/:id/weather-rich` (enriched, temperature
  included, now cached for 5 minutes per `backend/src/weatherCache.ts`)
  endpoints are sufficient.
- Per-pin temperature is *not* present in the data every location already
  carries (`location.weather.temperature_c` is `null` until the enriched
  fetch runs — this was the subject of the rate-limit investigation earlier
  in this session). Fetching it for all pins up front would multiply that
  9-endpoint fetch by the number of saved locations. So:
  - Marker icons use only `location.weather.condition`, which every location
    already has from the cheap list endpoint — zero extra requests to render
    the map.
  - The popup's temperature is fetched lazily, only for the clicked pin, via
    the existing `getEnrichedWeather(id)` API client function
    (`frontend/src/api.ts`) — reusing the cache already built, so reopening
    the same popup within 5 minutes costs nothing extra.
- Singapore's bounding box is small (lat 1.1–1.5, lon 103.6–104.1); no need
  for clustering or performance tuning at this scale.

## Decided (the "how", as chosen in conversation)

- **Layout**: `Hero.tsx` gains a `view: 'map' | 'details'` toggle, default
  `'map'`. A small segmented control sits at the top of the Hero panel,
  visible in both modes, independent of which location is selected.
  - `'details'` mode renders exactly what `Hero.tsx` renders today
    (unchanged).
  - `'map'` mode renders the new map component full-bleed in the space the
    detail content currently occupies.
- **Empty state**: if there are zero saved locations, `'details'` keeps its
  existing "Select a location" message. `'map'` still renders (centered on
  Singapore, no pins) — simplest option, and lets a brand-new user see the
  map immediately. This is my call; flag if you'd rather the toggle itself be
  hidden until a location exists.
- **New component** `frontend/src/components/MapView.tsx`: a `react-leaflet`
  `MapContainer` with an OpenStreetMap `TileLayer` (no API key, consistent
  with the rest of the project), fit to bounds of all saved locations (or
  centered on Singapore with a sensible default zoom if there are none).
- **Markers**: one per location, custom `divIcon` built from the project's
  existing inline-SVG icon set (`components/icons.tsx`) rather than Leaflet's
  default marker images (which need extra bundler config to load correctly
  under Vite). Icon chosen by the same condition-keyword matching
  (`thundery`/`rain`/`snow`/`clear`/default) already used in `ConditionCard`,
  `ForecastHourlyCard`, and `HourlyTimeline`.
- **Shared condition-icon helper**: that matching logic is currently
  duplicated across two components, `ConditionCard` and `ForecastHourlyCard`
  (correction after review: `HourlyTimeline`, built earlier this session, is
  *not* a third real call site — it only renders hardcoded mock data keyed
  off its own `HourlyCondition` enum, with no live condition string flowing
  into it yet). Since `MapView` needs the same string-matching mapping a
  third time, this design extracts it into one shared helper (e.g.
  `components/conditionIcon.tsx`) and updates `ConditionCard` and
  `ForecastHourlyCard` to use it. Wiring `HourlyTimeline` to real data and
  onto this helper is explicitly **out of scope** here — it's a separate,
  unrelated task (replacing its placeholder data), not part of this map
  feature.
- **Popup**: clicking a marker calls the store's `select(id)` (syncing the
  Sidebar) and opens a `react-leaflet` `Popup` as that marker's child. The
  popup shows the location name/area, condition icon, and temperature. On
  open, it fetches `getEnrichedWeather(id)` (loading state while in flight,
  `--` on failure, matching `formatTemperature`'s existing null handling).
- **State**: the `view` toggle is local UI state in `Hero.tsx` (not lifted
  into the global store — nothing else needs it).
- **Sidebar-driven selection has no special effect on the map (my call)**:
  selecting a location from the Sidebar while in Map mode does not pan,
  zoom, or auto-highlight its marker — `selectedId` only flows *out* of
  `MapView` (marker click → `select(id)`), never back in. This keeps the
  component decoupled and avoids marker-ref plumbing for a behavior nobody
  asked for; flag if you want the map to follow the Sidebar selection too.
- **Map re-fits bounds only when the set of location IDs changes (my
  call)**: `StoreProvider.load()` re-fetches and replaces the `locations`
  array on every create, refresh, and delete — not just once. Re-fitting the
  map's pan/zoom on every one of those would silently snap the user's view
  back mid-refresh, which would read as a bug. So `MapView` re-fits bounds
  only when the *set of location IDs* actually changes (a location added or
  removed), not on a same-ID weather refresh.

## What's left to the builder

- Exact Tailwind styling of the toggle control and the popup card (match
  existing glass-card conventions already used throughout the project).
- Whether the popup fetch is triggered on Leaflet's `popupopen` event vs. a
  `Popup` `eventHandlers` callback — an implementation detail with the same
  observable behavior either way.
- Unit/integration test coverage for the new `MapView` component and the
  extracted condition-icon helper (project has no existing frontend test
  setup — only backend `vitest` tests exist today; decide whether to add one
  or keep this component manually verified like the rest of the frontend).
- `frontend/src/components/MapView.tsx` will add a new file; check it still
  fits the project's 300-line guideline for TS/TSX files once built, and
  split out the marker/popup pieces into their own files if not.
