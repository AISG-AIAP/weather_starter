import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NearestArea, WeatherSnapshot } from '../weather.js';
import type { WeatherClient } from './locations.js';

const bishan: NearestArea = { area: 'Bishan', latitude: 1.350772, longitude: 103.839 };

const weather: WeatherSnapshot = {
  condition: 'Fair (Day)',
  observed_at: '2026-05-04T00:00:00Z',
  source: 'test',
  area: 'Bishan',
  valid_period_text: 'Now',
  temperature_c: 31,
  humidity_percent: 70,
  rainfall_mm: 0,
  wind_speed_knots: 5,
  wind_direction_degrees: 90,
  forecast_low_c: 26,
  forecast_high_c: 33,
  uv_index: 8,
  psi_twenty_four_hourly: 40,
  pm25_one_hourly: 8,
  air_quality_region: 'central',
  forecast_periods: [],
  daily_forecast: [],
};

const OUT_OF_BOUNDS_DETAIL = 'Coordinates must be within Singapore (lat 1.1-1.5, lon 103.6-104.1)';

describe('locations API request handling', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;
  let resetStore: typeof import('../db.js').resetStore;
  const getCurrentWeather = vi.fn<WeatherClient['getCurrentWeather']>();

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    ({ resetStore } = await import('../db.js'));
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        getCurrentWeather,
        async findNearestArea() {
          return bishan;
        },
      },
    });
  });

  beforeEach(async () => {
    getCurrentWeather.mockReset().mockResolvedValue(weather);
    await resetStore();
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('rejects a create without usable coordinates', async () => {
    const missing = await request(app).post('/api/locations').expect(422);
    expect(missing.body).toEqual({ detail: 'latitude and longitude are required' });

    await request(app).post('/api/locations').send({}).expect(422);
    await request(app).post('/api/locations').send({ latitude: 1.35 }).expect(422);
    await request(app).post('/api/locations').send({ longitude: 103.85 }).expect(422);
    await request(app)
      .post('/api/locations')
      .send({ latitude: 'abc', longitude: 103.85 })
      .expect(422);
    expect(getCurrentWeather).not.toHaveBeenCalled();
  });

  it('rejects a create outside the Singapore bounding box', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 51.5, longitude: -0.12 })
      .expect(422);
    expect(response.body).toEqual({ detail: OUT_OF_BOUNDS_DETAIL });

    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.05, longitude: 103.85 })
      .expect(422);
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.55, longitude: 103.85 })
      .expect(422);
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.5 })
      .expect(422);
    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 104.2 })
      .expect(422);
    expect(getCurrentWeather).not.toHaveBeenCalled();
  });

  it('accepts the corners of the Singapore bounding box', async () => {
    // The bounds are inclusive, so the extreme corners must still be savable.
    await request(app).post('/api/locations').send({ latitude: 1.1, longitude: 103.6 }).expect(201);
    await request(app).post('/api/locations').send({ latitude: 1.5, longitude: 104.1 }).expect(201);
  });

  it('accepts coordinates sent as numeric strings', async () => {
    // The browser form submits strings; the router coerces before validating.
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: '1.35', longitude: '103.85' })
      .expect(201);

    expect(response.body).toMatchObject({ latitude: 1.35, longitude: 103.85 });
    expect(getCurrentWeather).toHaveBeenCalledWith(1.35, 103.85);
  });

  it('returns a saved location by id', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    const response = await request(app).get(`/api/locations/${created.body.id}`).expect(200);

    expect(response.body).toEqual(created.body);
    expect(response.body.created_at).toEqual(expect.any(String));
  });

  it('returns 404 for ids that are unknown or not numbers', async () => {
    const unknown = await request(app).get('/api/locations/4242').expect(404);
    expect(unknown.body).toEqual({ detail: 'Location not found' });

    await request(app).get('/api/locations/not-a-number').expect(404);
    await request(app).delete('/api/locations/not-a-number').expect(404);
  });

  it('lists an empty store as an empty array', async () => {
    const response = await request(app).get('/api/locations').expect(200);

    expect(response.body).toEqual({ locations: [] });
  });

  it('lists saved locations newest first', async () => {
    for (const longitude of [103.81, 103.82, 103.83]) {
      await request(app).post('/api/locations').send({ latitude: 1.35, longitude }).expect(201);
    }

    const response = await request(app).get('/api/locations').expect(200);

    // created_at only has second resolution, so the id tiebreaker is what keeps the newest
    // pin at the top of the sidebar when several are added in quick succession.
    expect(
      response.body.locations.map((location: { longitude: number }) => location.longitude),
    ).toEqual([103.83, 103.82, 103.81]);
  });
});
