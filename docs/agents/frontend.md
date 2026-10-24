# Frontend guidance

Read this file when changing React state, API calls, dashboard components, themes, or the Leaflet map.

## Data and component flow

- `main.tsx` mounts `App`.
- `App.tsx` installs `StoreProvider` and renders the dashboard layout.
- `state/store.tsx` owns locations, selection, loading/error state, and create/delete/refresh actions.
- `api.ts` is the frontend HTTP boundary and sends best-effort interaction logs to `/api/logs`.
- `types.ts` mirrors backend response shapes.
- `components/` contains the sidebar, selected-location hero, forecast and metric tiles, theme selector, and Leaflet map.

Keep application HTTP calls in `api.ts`. When a backend weather response changes, update `types.ts`, store/component consumers, and backend mappings in the same change.

## Map behavior

The map displays saved locations; location creation remains in the add-location flow rather than on the map. It uses OpenStreetMap tiles at runtime, so the basemap requires network access even when saved weather data is local.

## Validation

Frontend automated tests are not configured. For UI changes, run the frontend or root production build and perform a focused manual browser check of the affected states and responsive layout.
