import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SingaporeWeatherClient, WeatherProviderError } from './weather.js';

const forecastPayload = {
  code: 0,
  data: {
    area_metadata: [
      {
        name: 'Bishan',
        label_location: { latitude: 1.350772, longitude: 103.839 },
      },
      {
        name: 'Bedok',
        label_location: { latitude: 1.321, longitude: 103.924 },
      },
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

const humidityPayload = {
  code: 0,
  data: {
    stations: [
      {
        id: 'S109',
        name: 'Ang Mo Kio Avenue 5',
        location: { latitude: 1.3793, longitude: 103.85 },
      },
    ],
    readings: [
      {
        timestamp: '2026-11-21T22:43:00+08:00',
        data: [{ stationId: 'S109', value: 80 }],
      },
    ],
  },
};

const rainfallPayload = {
  code: 0,
  data: {
    stations: [
      {
        id: 'S109',
        name: 'Ang Mo Kio Avenue 5',
        location: { latitude: 1.3793, longitude: 103.85 },
      },
    ],
    readings: [
      {
        timestamp: '2026-11-21T22:43:00+08:00',
        data: [{ stationId: 'S109', value: 0.4 }],
      },
    ],
  },
};

const windSpeedPayload = {
  code: 0,
  data: {
    stations: [
      {
        id: 'S109',
        name: 'Ang Mo Kio Avenue 5',
        location: { latitude: 1.3793, longitude: 103.85 },
      },
    ],
    readings: [
      {
        timestamp: '2026-11-21T22:43:00+08:00',
        data: [{ stationId: 'S109', value: 6 }],
      },
    ],
  },
};

const uvPayload = {
  code: 0,
  data: {
    records: [
      {
        updatedTimestamp: '2026-11-21T19:11:39+08:00',
        index: [{ hour: '2026-11-21T19:00:00+08:00', value: 3 }],
      },
    ],
  },
};

const airTemperaturePayload = {
  code: 0,
  data: {
    stations: [
      {
        id: 'S109',
        name: 'Ang Mo Kio Avenue 5',
        location: { latitude: 1.3793, longitude: 103.85 },
      },
      {
        id: 'S106',
        name: 'Pulau Ubin',
        location: { latitude: 1.4168, longitude: 103.9673 },
      },
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
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // A large call budget keeps these tests off the real rate-limit window.
  const client = () =>
    new SingaporeWeatherClient({
      baseUrl,
      timeoutMs: 2000,
      realtimeCallsPerWindow: 1000,
    });

  it('reads the condition, temperature, humidity, rainfall, wind speed, and UV', async () => {
    respond = (path) => {
      if (path === '/v2/real-time/api/two-hr-forecast') {
        return { status: 200, body: forecastPayload };
      }
      if (path === '/v2/real-time/api/air-temperature') {
        return { status: 200, body: airTemperaturePayload };
      }
      if (path === '/v2/real-time/api/relative-humidity') {
        return { status: 200, body: humidityPayload };
      }
      if (path === '/v2/real-time/api/rainfall') {
        return { status: 200, body: rainfallPayload };
      }
      if (path === '/v2/real-time/api/wind-speed') {
        return { status: 200, body: windSpeedPayload };
      }
      if (path === '/v2/real-time/api/uv') {
        return { status: 200, body: uvPayload };
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
      humidity_percent: 80,
      rainfall_mm: 0.4,
      wind_speed_knots: 6,
      uv_index: 3,
    });
  });

  it('serves repeat refreshes within the TTL from cache without upstream calls', async () => {
    const hits: string[] = [];
    respond = (path) => {
      hits.push(path);
      if (path === '/v2/real-time/api/two-hr-forecast')
        return { status: 200, body: forecastPayload };
      return { status: 200, body: airTemperaturePayload };
    };
    let clock = 1_000_000;
    const cached = new SingaporeWeatherClient({
      baseUrl,
      timeoutMs: 2000,
      realtimeCallsPerWindow: 1000,
      now: () => clock,
    });

    await cached.getCurrentWeather(1.35, 103.85);
    const firstCount = hits.length;
    clock += 30_000; // inside the 5-minute forecast TTL and the 60 s station TTL
    await cached.getCurrentWeather(1.35, 103.85);

    expect(hits.length).toBe(firstCount);
  });

  it('shares one upstream request between concurrent refreshes', async () => {
    const hits: string[] = [];
    respond = (path) => {
      hits.push(path);
      if (path === '/v2/real-time/api/two-hr-forecast')
        return { status: 200, body: forecastPayload };
      return { status: 200, body: airTemperaturePayload };
    };
    const shared = new SingaporeWeatherClient({
      baseUrl,
      timeoutMs: 2000,
      realtimeCallsPerWindow: 1000,
      now: () => 1_000_000,
    });

    await Promise.all([
      shared.getCurrentWeather(1.35, 103.85),
      shared.getCurrentWeather(1.3, 103.8),
    ]);

    const forecastCalls = hits.filter(
      (path) => path === '/v2/real-time/api/two-hr-forecast',
    );
    expect(forecastCalls).toHaveLength(1);
  });

  it('falls back to a stale cached payload when the provider later fails', async () => {
    let failing = false;
    respond = (path) => {
      if (failing) return { status: 500, body: {} };
      if (path === '/v2/real-time/api/two-hr-forecast')
        return { status: 200, body: forecastPayload };
      return { status: 200, body: airTemperaturePayload };
    };
    let clock = 1_000_000;
    const stale = new SingaporeWeatherClient({
      baseUrl,
      timeoutMs: 2000,
      realtimeCallsPerWindow: 1000,
      now: () => clock,
    });

    const first = await stale.getCurrentWeather(1.35, 103.85);
    failing = true;
    clock += 6 * 60_000; // past every TTL
    const second = await stale.getCurrentWeather(1.35, 103.85);

    expect(second.condition).toBe(first.condition);
    expect(second.temperature_c).toBe(first.temperature_c);
  });

  it('keeps the stored value for a field whose endpoint fails', async () => {
    respond = (path) => {
      if (path === '/v2/real-time/api/two-hr-forecast')
        return { status: 200, body: forecastPayload };
      if (path === '/v2/real-time/api/air-temperature')
        return { status: 200, body: airTemperaturePayload };
      return { status: 500, body: {} };
    };

    const snapshot = await client().getCurrentWeather(1.35, 103.85, {
      humidity_percent: 70,
      uv_index: 5,
      psi_twenty_four_hourly: 42,
    });

    expect(snapshot).toMatchObject({
      temperature_c: 27.8,
      humidity_percent: 70,
      uv_index: 5,
      psi_twenty_four_hourly: 42,
    });
  });

  it('limits realtime calls to the window cap and waits instead of sending a 7th', async () => {
    const hits: number[] = [];
    respond = (path) => {
      if (path === '/v2/real-time/api/two-hr-forecast')
        return { status: 200, body: forecastPayload };
      return { status: 200, body: airTemperaturePayload };
    };
    const limited = new SingaporeWeatherClient({
      baseUrl,
      timeoutMs: 2000,
      realtimeCallsPerWindow: 3,
      realtimeWindowMs: 200,
    });
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (
      input: Parameters<typeof fetch>[0],
      init?: RequestInit,
    ) => {
      if (String(input).includes(baseUrl)) hits.push(Date.now());
      return realFetch(input, init);
    }) as typeof fetch;

    try {
      await limited.getCurrentWeather(1.35, 103.85);
    } finally {
      globalThis.fetch = realFetch;
    }

    // Any 200 ms window must hold at most 3 realtime calls.
    for (let i = 0; i < hits.length; i++) {
      const inWindow = hits.filter(
        (t) => t >= hits[i] && t < hits[i] + 200,
      ).length;
      expect(inWindow).toBeLessThanOrEqual(3);
    }
    expect(hits.length).toBeGreaterThan(3);
  });

  it('throws WeatherProviderError when the provider returns HTTP 500', async () => {
    respond = () => ({ status: 500, body: {} });
    await expect(
      client().getCurrentWeather(1.35, 103.85),
    ).rejects.toBeInstanceOf(WeatherProviderError);
  });

  it('throws WeatherProviderError when the provider reports an error code', async () => {
    respond = () => ({
      status: 200,
      body: { code: 24, errorMsg: 'rate limited' },
    });
    await expect(client().getCurrentWeather(1.35, 103.85)).rejects.toThrow(
      'rate limited',
    );
  });

  it('throws WeatherProviderError when the provider is unreachable', async () => {
    const unreachable = new SingaporeWeatherClient({
      baseUrl: 'http://127.0.0.1:1',
      timeoutMs: 2000,
    });
    await expect(
      unreachable.getCurrentWeather(1.35, 103.85),
    ).rejects.toBeInstanceOf(WeatherProviderError);
  });
});
