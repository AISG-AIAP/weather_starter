import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { WeatherProviderError, type NearestArea, type WeatherSnapshot } from '../weather.js';
import type { WeatherClient } from './locations.js';

const bishan: NearestArea = { area: 'Bishan', latitude: 1.350772, longitude: 103.839 };

const weather: WeatherSnapshot = {
  condition: 'Thundery Showers',
  observed_at: '2026-05-04T02:00:00Z',
  source: 'test',
  area: 'Bishan',
  valid_period_text: '10 am to 12 pm',
  temperature_c: 27.5,
  humidity_percent: 88,
  rainfall_mm: 3.2,
  wind_speed_knots: 6,
  wind_direction_degrees: 210,
  forecast_low_c: 24,
  forecast_high_c: 31,
  uv_index: 3,
  psi_twenty_four_hourly: 55,
  pm25_one_hourly: 14,
  air_quality_region: 'central',
  forecast_periods: [{ label: '10 am to 12 pm', forecast: 'Thundery Showers' }],
  daily_forecast: [
    { date: '2026-05-05', forecast: 'Showers', temperature_low_c: 24, temperature_high_c: 31 },
  ],
};

describe('weather provider integration', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;
  let resetStore: typeof import('../db.js').resetStore;
  const getCurrentWeather = vi.fn<WeatherClient['getCurrentWeather']>();
  const findNearestArea = vi.fn<WeatherClient['findNearestArea']>();

  async function createLocation(latitude = 1.35, longitude = 103.85) {
    const response = await request(app).post('/api/locations').send({ latitude, longitude });
    expect(response.status).toBe(201);
    return response.body as { id: number };
  }

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    ({ resetStore } = await import('../db.js'));
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: { getCurrentWeather, findNearestArea },
    });
  });

  beforeEach(async () => {
    getCurrentWeather.mockReset().mockResolvedValue(weather);
    findNearestArea.mockReset().mockResolvedValue(bishan);
    await resetStore();
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('stores a location even when the provider is down at create time', async () => {
    getCurrentWeather.mockRejectedValueOnce(new WeatherProviderError('provider unreachable'));

    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    // A provider outage must not cost the user their pin; the card just shows as un-refreshed.
    expect(created.body.weather).toMatchObject({
      condition: 'Not refreshed',
      source: 'not-refreshed',
      area: null,
      temperature_c: null,
      forecast_periods: [],
      daily_forecast: [],
    });

    const stored = await request(app).get(`/api/locations/${created.body.id}`).expect(200);
    expect(stored.body.weather.condition).toBe('Not refreshed');
  });

  it('refreshes a saved location on demand and persists the snapshot', async () => {
    getCurrentWeather.mockRejectedValueOnce(new WeatherProviderError('provider unreachable'));
    const { id } = await createLocation(1.35, 103.85);

    const refreshed = await request(app).post(`/api/locations/${id}/refresh`).expect(200);

    expect(getCurrentWeather).toHaveBeenLastCalledWith(1.35, 103.85);
    expect(refreshed.body).toMatchObject({
      id,
      latitude: 1.35,
      longitude: 103.85,
      weather: {
        condition: 'Thundery Showers',
        area: 'Bishan',
        valid_period_text: '10 am to 12 pm',
        temperature_c: 27.5,
        humidity_percent: 88,
        rainfall_mm: 3.2,
        wind_speed_knots: 6,
        wind_direction_degrees: 210,
        uv_index: 3,
        psi_twenty_four_hourly: 55,
        pm25_one_hourly: 14,
        air_quality_region: 'central',
        forecast_low_c: 24,
        forecast_high_c: 31,
        forecast_periods: [{ label: '10 am to 12 pm', forecast: 'Thundery Showers' }],
        daily_forecast: [
          {
            date: '2026-05-05',
            forecast: 'Showers',
            temperature_low_c: 24,
            temperature_high_c: 31,
          },
        ],
      },
    });

    const stored = await request(app).get(`/api/locations/${id}`).expect(200);
    expect(stored.body.weather).toEqual(refreshed.body.weather);
  });

  it('returns 404 when refreshing a location that is not saved', async () => {
    await request(app).post('/api/locations/9999/refresh').expect(404);
    await request(app).post('/api/locations/not-a-number/refresh').expect(404);
    expect(getCurrentWeather).not.toHaveBeenCalled();
  });

  it('returns 502 and keeps the last snapshot when a refresh hits a provider error', async () => {
    const { id } = await createLocation();
    getCurrentWeather.mockRejectedValueOnce(new WeatherProviderError('rate limit reached'));

    const response = await request(app).post(`/api/locations/${id}/refresh`).expect(502);

    expect(response.body).toEqual({ detail: 'rate limit reached' });
    const stored = await request(app).get(`/api/locations/${id}`).expect(200);
    expect(stored.body.weather.condition).toBe('Thundery Showers');
  });

  it('returns 500 when a refresh fails for a non-provider reason', async () => {
    const { id } = await createLocation();
    getCurrentWeather.mockRejectedValueOnce(new TypeError('client is broken'));

    const response = await request(app).post(`/api/locations/${id}/refresh`).expect(500);

    expect(response.body).toEqual({ detail: 'Internal server error' });
  });

  it('returns 502 when the provider errors while resolving the nearest area', async () => {
    findNearestArea.mockRejectedValueOnce(new WeatherProviderError('forecast feed unavailable'));

    const response = await request(app)
      .get('/api/areas/nearest')
      .query({ lat: 1.35, lon: 103.85 })
      .expect(502);

    expect(response.body).toEqual({ detail: 'forecast feed unavailable' });
  });

  it('returns 502 when the provider publishes no forecast areas', async () => {
    findNearestArea.mockResolvedValueOnce(null);

    const response = await request(app)
      .get('/api/areas/nearest')
      .query({ lat: 1.35, lon: 103.85 })
      .expect(502);

    expect(response.body).toEqual({ detail: 'No forecast areas available' });
  });
});
