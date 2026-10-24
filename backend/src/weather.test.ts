import { afterEach, describe, expect, it, vi } from 'vitest';
import { SingaporeWeatherClient } from './weather.js';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('SingaporeWeatherClient two-hour forecast', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves the latest forecast and selects the nearest forecast area', async () => {
    const providerPayload = {
      code: 0,
      data: {
        area_metadata: [
          {
            name: 'Ang Mo Kio',
            label_location: { latitude: 1.375, longitude: 103.839 },
          },
          {
            name: 'Bishan',
            label_location: { latitude: 1.350772, longitude: 103.839 },
          },
        ],
        items: [
          {
            update_timestamp: '2026-08-02T17:36:44+08:00',
            timestamp: '2026-08-02T17:30:00+08:00',
            valid_period: {
              start: '2026-08-02T17:30:00+08:00',
              end: '2026-08-02T19:30:00+08:00',
              text: '5.30 pm to 7.30 pm',
            },
            forecasts: [
              { area: 'Ang Mo Kio', forecast: 'Light Rain' },
              { area: 'Bishan', forecast: 'Cloudy' },
            ],
          },
        ],
      },
      errorMsg: '',
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      return url.endsWith('/two-hr-forecast')
        ? jsonResponse(providerPayload)
        : jsonResponse({ detail: 'Unavailable in this test' }, 503);
    });
    const client = new SingaporeWeatherClient({ apiKey: 'test-key' });

    const weather = await client.getCurrentWeather(1.351, 103.839);

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'test-key' }),
      }),
    );
    expect(weather).toMatchObject({
      condition: 'Cloudy',
      area: 'Bishan',
      valid_period_text: '5.30 pm to 7.30 pm',
      observed_at: '2026-08-02T17:36:44+08:00',
      source: 'api-open.data.gov.sg',
    });
  });

  it('populates weather metrics from the nearest reporting stations', async () => {
    const forecastPayload = {
      code: 0,
      data: {
        area_metadata: [
          {
            name: 'Bishan',
            label_location: { latitude: 1.350772, longitude: 103.839 },
          },
        ],
        items: [
          {
            update_timestamp: '2026-08-02T17:36:44+08:00',
            valid_period: { text: '5.30 pm to 7.30 pm' },
            forecasts: [{ area: 'Bishan', forecast: 'Cloudy' }],
          },
        ],
      },
    };
    const stationPayload = (value: number, timestamp: string) => ({
      code: 0,
      data: {
        stations: [
          {
            id: 'far',
            name: 'Far station',
            location: { latitude: 1.44, longitude: 103.98 },
          },
          {
            id: 'near',
            name: 'Nearest station',
            location: { latitude: 1.351, longitude: 103.84 },
          },
        ],
        readings: [
          {
            timestamp,
            data: [
              { stationId: 'far', value: value + 100 },
              { stationId: 'near', value },
            ],
          },
        ],
      },
    });
    const responses: Record<string, unknown> = {
      'two-hr-forecast': forecastPayload,
      'air-temperature': stationPayload(29.4, '2026-08-02T18:00:00+08:00'),
      'relative-humidity': stationPayload(78.2, '2026-08-02T18:00:00+08:00'),
      rainfall: stationPayload(0.6, '2026-08-02T18:00:00+08:00'),
      'wind-speed': stationPayload(4.5, '2026-08-02T18:00:00+08:00'),
      'wind-direction': stationPayload(145, '2026-08-02T18:00:00+08:00'),
      uv: {
        code: 0,
        data: {
          records: [
            {
              updatedTimestamp: '2026-08-02T18:05:00+08:00',
              index: [{ hour: '2026-08-02T18:00:00+08:00', value: 6 }],
            },
          ],
        },
      },
      psi: {
        code: 0,
        data: {
          regionMetadata: [
            { name: 'west', labelLocation: { latitude: 1.35735, longitude: 103.7 } },
            { name: 'central', labelLocation: { latitude: 1.35735, longitude: 103.82 } },
            { name: 'east', labelLocation: { latitude: 1.35735, longitude: 103.94 } },
          ],
          items: [
            {
              updatedTimestamp: '2026-08-02T18:10:00+08:00',
              readings: {
                psi_twenty_four_hourly: { west: 48, central: 42, east: 45 },
              },
            },
          ],
        },
      },
      pm25: {
        code: 0,
        data: {
          items: [
            {
              updatedTimestamp: '2026-08-02T18:00:00+08:00',
              readings: {
                pm25_one_hourly: { west: 12, central: 9, east: 10 },
              },
            },
          ],
        },
      },
      'twenty-four-hr-forecast': {
        code: 0,
        data: {
          records: [
            {
              updatedTimestamp: '2026-08-02T18:15:00+08:00',
              general: { temperature: { low: 25, high: 33 } },
              periods: [
                {
                  timePeriod: { text: '6 pm to Midnight' },
                  regions: {
                    west: { text: 'Showers' },
                    central: { text: 'Cloudy' },
                    east: { text: 'Fair' },
                  },
                },
                {
                  timePeriod: { text: 'Midnight to 6 am' },
                  regions: {
                    west: { text: 'Cloudy' },
                    central: { text: 'Partly Cloudy (Night)' },
                    east: { text: 'Partly Cloudy (Night)' },
                  },
                },
              ],
            },
          ],
        },
      },
      '4-day-weather-forecast': {
        items: [
          {
            update_timestamp: '2026-08-02T18:20:00+08:00',
            forecasts: [
              {
                date: '2026-08-03',
                forecast: 'Thundery Showers',
                temperature: { low: 24, high: 33 },
              },
              {
                date: '2026-08-04',
                forecast: 'Afternoon Showers',
                temperature: { low: 25, high: 34 },
              },
            ],
          },
        ],
      },
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const endpoint = String(input).split('/').at(-1) as string;
      return jsonResponse(responses[endpoint]);
    });
    const client = new SingaporeWeatherClient();

    const weather = await client.getCurrentWeather(1.351, 103.839);

    expect(fetchSpy).toHaveBeenCalledTimes(11);
    expect(weather).toMatchObject({
      condition: 'Cloudy',
      area: 'Bishan',
      temperature_c: 29.4,
      humidity_percent: 78.2,
      rainfall_mm: 0.6,
      wind_speed_knots: 4.5,
      wind_direction_degrees: 145,
      uv_index: 6,
      psi_twenty_four_hourly: 42,
      pm25_one_hourly: 9,
      air_quality_region: 'central',
      forecast_low_c: 25,
      forecast_high_c: 33,
      forecast_periods: [
        { label: '6 pm to Midnight', forecast: 'Cloudy' },
        { label: 'Midnight to 6 am', forecast: 'Partly Cloudy (Night)' },
      ],
      daily_forecast: [
        {
          date: '2026-08-03',
          forecast: 'Thundery Showers',
          temperature_low_c: 24,
          temperature_high_c: 33,
        },
        {
          date: '2026-08-04',
          forecast: 'Afternoon Showers',
          temperature_low_c: 25,
          temperature_high_c: 34,
        },
      ],
      observed_at: '2026-08-02T18:20:00+08:00',
    });
  });

  it('retries a rate-limited real-time request once', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ errorMsg: 'Too many requests' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '0' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          code: 0,
          data: {
            records: [
              {
                updatedTimestamp: '2026-08-02T18:05:00+08:00',
                index: [{ hour: '2026-08-02T18:00:00+08:00', value: 6 }],
              },
            ],
          },
        }),
      );
    const client = new SingaporeWeatherClient();

    await expect(client.fetchUvIndex()).resolves.toEqual({
      value: 6,
      timestamp: '2026-08-02T18:05:00+08:00',
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
