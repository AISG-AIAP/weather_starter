import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NearestArea, WeatherSnapshot } from '../weather.js';

// Stands in for the label_location points that ride along with the two-hour forecast payload.
const areas: NearestArea[] = [
  { area: 'Ang Mo Kio', latitude: 1.375, longitude: 103.839 },
  { area: 'Bishan', latitude: 1.350772, longitude: 103.839 },
  { area: 'Jurong West', latitude: 1.35, longitude: 103.7 },
  { area: 'Woodlands', latitude: 1.4382, longitude: 103.789 },
];

const weather: WeatherSnapshot = {
  condition: 'Cloudy',
  observed_at: '2026-05-04T00:00:00Z',
  source: 'test',
  area: 'Bishan',
  valid_period_text: 'Now',
  temperature_c: 29,
  humidity_percent: 80,
  rainfall_mm: 0,
  wind_speed_knots: 4,
  wind_direction_degrees: 180,
  forecast_low_c: 25,
  forecast_high_c: 32,
  uv_index: 7,
  psi_twenty_four_hourly: 42,
  pm25_one_hourly: 9,
  air_quality_region: 'central',
  forecast_periods: [{ label: 'Now', forecast: 'Cloudy' }],
  daily_forecast: [
    { date: '2026-05-04', forecast: 'Cloudy', temperature_low_c: 25, temperature_high_c: 32 },
  ],
};

describe('locations API', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          return weather;
        },
        async findNearestArea(latitude: number, longitude: number) {
          let nearest: { area: NearestArea; distance: number } | null = null;
          for (const area of areas) {
            const distance = (area.latitude - latitude) ** 2 + (area.longitude - longitude) ** 2;
            if (!nearest || distance < nearest.distance) nearest = { area, distance };
          }
          return nearest?.area ?? null;
        },
      },
    });
  });

  afterAll(async () => {
    const { closeDatabase } = await import('../db.js');
    closeDatabase();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('refreshes weather when a location is created', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 1,
      latitude: 1.35,
      longitude: 103.85,
      weather: {
        condition: 'Cloudy',
        area: 'Bishan',
        valid_period_text: 'Now',
        temperature_c: 29,
      },
    });

    const listResponse = await request(app).get('/api/locations').expect(200);
    expect(listResponse.body.locations).toHaveLength(1);
    expect(listResponse.body.locations[0].weather).toMatchObject({
      condition: 'Cloudy',
      area: 'Bishan',
      valid_period_text: 'Now',
      temperature_c: 29,
      humidity_percent: 80,
      rainfall_mm: 0,
      wind_speed_knots: 4,
      wind_direction_degrees: 180,
      uv_index: 7,
      psi_twenty_four_hourly: 42,
      pm25_one_hourly: 9,
      air_quality_region: 'central',
      forecast_low_c: 25,
      forecast_high_c: 32,
      forecast_periods: [{ label: 'Now', forecast: 'Cloudy' }],
      daily_forecast: [
        {
          date: '2026-05-04',
          forecast: 'Cloudy',
          temperature_low_c: 25,
          temperature_high_c: 32,
        },
      ],
    });
  });

  it('snaps a rough position onto the nearest forecast area', async () => {
    const response = await request(app)
      .get('/api/areas/nearest')
      .query({ lat: 1.3745, lon: 103.8412 })
      .expect(200);

    expect(response.body).toEqual({
      area: 'Ang Mo Kio',
      latitude: 1.375,
      longitude: 103.839,
    });
  });

  it('returns an identical coordinate for nearby positions in the same area', async () => {
    const first = await request(app)
      .get('/api/areas/nearest')
      .query({ lat: 1.3742, lon: 103.8401 })
      .expect(200);
    const second = await request(app)
      .get('/api/areas/nearest')
      .query({ lat: 1.3759, lon: 103.8377 })
      .expect(200);

    // Two GPS fixes metres apart must collapse to one coordinate, otherwise the duplicate
    // check on POST /locations can never fire.
    expect(first.body).toEqual(second.body);
  });

  it('rejects positions outside Singapore', async () => {
    await request(app).get('/api/areas/nearest').query({ lat: 51.5, lon: -0.12 }).expect(422);
    await request(app).get('/api/areas/nearest').query({ lat: 'abc', lon: 103.8 }).expect(422);
    await request(app).get('/api/areas/nearest').expect(422);
  });

  it('rejects a second location at an already-saved area point', async () => {
    const area = await request(app)
      .get('/api/areas/nearest')
      .query({ lat: 1.352, lon: 103.84 })
      .expect(200);

    await request(app)
      .post('/api/locations')
      .send({ latitude: area.body.latitude, longitude: area.body.longitude })
      .expect(201);
    await request(app)
      .post('/api/locations')
      .send({ latitude: area.body.latitude, longitude: area.body.longitude })
      .expect(409);
  });

  it('deletes a saved location', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.36, longitude: 103.86 })
      .expect(201);

    await request(app).delete(`/api/locations/${created.body.id}`).expect(204);
    await request(app).get(`/api/locations/${created.body.id}`).expect(404);
    await request(app).delete(`/api/locations/${created.body.id}`).expect(404);

    const listResponse = await request(app).get('/api/locations').expect(200);
    expect(listResponse.body.locations).not.toContainEqual(
      expect.objectContaining({ id: created.body.id }),
    );
  });
});
