---
name: sg-weather-api
description: Singapore data.gov.sg weather API reference — all endpoints, response shapes, and usage patterns for the weather starter app.
---

# Singapore Weather API

Base URL: `https://api-open.data.gov.sg`

## 2-Hour Forecast (used in this app)

- `GET /v2/real-time/api/two-hr-forecast`
- Area-based: forecasts grouped by named areas (e.g., "Ang Mo Kio", "Jurong West")
- Returns `area_metadata` (names + coordinates) and per-area conditions

## Realtime Station Readings

Station-based — match to nearest station using Haversine distance.

| Endpoint                                  | Measurement    | Unit    |
| ----------------------------------------- | -------------- | ------- |
| `GET /v2/real-time/api/air-temperature`   | Temperature    | °C      |
| `GET /v2/real-time/api/relative-humidity` | Humidity       | %       |
| `GET /v2/real-time/api/rainfall`          | Rainfall       | mm      |
| `GET /v2/real-time/api/wind-speed`        | Wind speed     | knots   |
| `GET /v2/real-time/api/wind-direction`    | Wind direction | degrees |

## Extended Forecasts (v1 — different response shape)

| Endpoint                                       | Description                      |
| ---------------------------------------------- | -------------------------------- |
| `GET /v1/environment/24-hour-weather-forecast` | Time periods by region           |
| `GET /v1/environment/4-day-weather-forecast`   | Daily high/low temps and outlook |

## Response Patterns

- v2: data in `data.records[].readings` or `data.records[].forecasts`
- v1: data in `data.items[]`
- No API key required. If rate-limited (429), register at data.gov.sg for a free key.
