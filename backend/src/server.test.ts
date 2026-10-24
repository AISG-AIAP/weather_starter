import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeatherClient } from './routes/locations.js';

describe('app endpoints', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('./server.js').createApp>>;
  const findNearestArea = vi.fn<WeatherClient['findNearestArea']>();

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('./server.js');
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          throw new Error('getCurrentWeather is not exercised by these tests');
        },
        findNearestArea,
      },
    });
  });

  beforeEach(() => {
    findNearestArea.mockReset();
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('reports health without touching the weather provider', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'healthy' });
    expect(findNearestArea).not.toHaveBeenCalled();
  });

  it('accepts a frontend interaction log', async () => {
    await request(app)
      .post('/api/logs')
      .send({ event: 'location.added', page: '/', metadata: { area: 'Bishan' } })
      .expect(204);
  });

  it('accepts an interaction log without optional fields', async () => {
    await request(app).post('/api/logs').send({ event: 'sidebar_toggle' }).expect(204);
  });

  it('rejects interaction logs whose event name does not match the allowed shape', async () => {
    // The pattern exists so a compromised frontend cannot inject arbitrary strings into the
    // log stream: lowercase start, at least two characters, no spaces, 64 characters max.
    await request(app).post('/api/logs').expect(422);
    await request(app).post('/api/logs').send({}).expect(422);
    await request(app).post('/api/logs').send({ event: 42 }).expect(422);
    await request(app).post('/api/logs').send({ event: '' }).expect(422);
    await request(app).post('/api/logs').send({ event: 'a' }).expect(422);
    await request(app).post('/api/logs').send({ event: 'Location.Added' }).expect(422);
    await request(app).post('/api/logs').send({ event: 'location added' }).expect(422);
    await request(app)
      .post('/api/logs')
      .send({ event: `x${'a'.repeat(64)}` })
      .expect(422);
  });

  it('reports a 422 with a detail message the frontend can render', async () => {
    const response = await request(app).post('/api/logs').send({ event: '' }).expect(422);

    expect(response.body).toEqual({ detail: 'event is required' });
  });

  it('turns an unexpected route failure into a 500 without leaking internals', async () => {
    findNearestArea.mockRejectedValueOnce(new Error('sqlite disk image is malformed'));

    const response = await request(app)
      .get('/api/areas/nearest')
      .query({ lat: 1.35, lon: 103.85 })
      .expect(500);

    expect(response.body).toEqual({ detail: 'Internal server error' });
  });
});
