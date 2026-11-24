---
name: sg-weather-api
description: Singapore data.gov.sg weather API reference - endpoints, response shapes, and usage patterns for the weather starter app.
---

# Singapore Weather API

Base URL: https://api-open.data.gov.sg

## 2-Hour Forecast (used in this app)
- GET /v2/real-time/api/two-hr-forecast
- Area-based forecasts grouped by named areas
- Returns area metadata and per-area conditions

## Realtime Station Readings
- GET /v2/real-time/api/air-temperature
- GET /v2/real-time/api/relative-humidity
- GET /v2/real-time/api/rainfall
- GET /v2/real-time/api/wind-speed
- GET /v2/real-time/api/wind-direction

## Extended Forecasts
- GET /v1/environment/24-hour-weather-forecast
- GET /v1/environment/4-day-weather-forecast