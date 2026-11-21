import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SingaporeWeatherClient, WeatherProviderError } from './weather.js';

const forecastPayload = {
  code: 0,
  data: {
    area_metadata: [
      { name: 'Bishan', label_location: { latitude: 1.350772, longitude: 103.839 } },
      { name: 'Bedok', label_location: { latitude: 1.321, longitude: 103.924 } },
    ],
    items: [
      {
        update_timestamp: '2026-11-21T22:36:51+08:00',
        timestamp: '2026-11-21T22:30:00+08:00',
        valid_period: { text: '10.30 pm to 12.30 am' },
        forecasts: [
          { area: 'Bishan', forecast: 'Partly Cloudy (Night)' },
          { area: 'Bedok', forecast: 'Thundery Showers' },
        ],
      },
    ],
  },
};

const airTemperaturePayload = {
  code: 0,
  data: {
    stations: [
      { id: 'S109', name: 'Ang Mo Kio Avenue 5', location: { latitude: 1.3793, longitude: 103.85 } },
      { id: 'S106', name: 'Pulau Ubin', location: { latitude: 1.4168, longitude: 103.9673 } },
    ],
    readings: [
      {
        timestamp: '2026-11-21T22:43:00+08:00',
        data: [
          { stationId: 'S109', value: 27.8 },
          { stationId: 'S106', value: 26.6 },
        ],
      },
    ],
  },
};

describe('SingaporeWeatherClient.getCurrentWeather', () => {
  let server: Server;
  let baseUrl: string;
  let respond: (path: string) => { status: number; body: unknown };

  beforeAll(async () => {
    server = createServer((request, response) => {
      const { status, body } = respond(request.url ?? '');
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(body));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const client = () => new SingaporeWeatherClient({ baseUrl, timeoutMs: 2000 });

  it('reads the condition for the nearest area and the nearest-station temperature', async () => {
    respond = (path) => {
      if (path === '/v2/real-time/api/two-hr-forecast') {
        return { status: 200, body: forecastPayload };
      }
      if (path === '/v2/real-time/api/air-temperature') {
        return { status: 200, body: airTemperaturePayload };
      }
      return { status: 404, body: {} };
    };

    const snapshot = await client().getCurrentWeather(1.35, 103.85);

    expect(snapshot).toMatchObject({
      condition: 'Partly Cloudy (Night)',
      area: 'Bishan',
      observed_at: '2026-11-21T22:36:51+08:00',
      valid_period_text: '10.30 pm to 12.30 am',
      source: 'api-open.data.gov.sg',
      temperature_c: 27.8,
    });
  });

  it('throws WeatherProviderError when the provider returns HTTP 500', async () => {
    respond = () => ({ status: 500, body: {} });
    await expect(client().getCurrentWeather(1.35, 103.85)).rejects.toBeInstanceOf(
      WeatherProviderError,
    );
  });

  it('throws WeatherProviderError when the provider reports an error code', async () => {
    respond = () => ({ status: 200, body: { code: 24, errorMsg: 'rate limited' } });
    await expect(client().getCurrentWeather(1.35, 103.85)).rejects.toThrow('rate limited');
  });

  it('throws WeatherProviderError when the provider is unreachable', async () => {
    const unreachable = new SingaporeWeatherClient({
      baseUrl: 'http://127.0.0.1:1',
      timeoutMs: 2000,
    });
    await expect(unreachable.getCurrentWeather(1.35, 103.85)).rejects.toBeInstanceOf(
      WeatherProviderError,
    );
  });
});
