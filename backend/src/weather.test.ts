import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SingaporeWeatherClient } from './weather.js';

function okJson(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe('SingaporeWeatherClient.getEnrichedWeather caching', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('two-hr-forecast')) {
        return okJson({
          code: 0,
          data: {
            area_metadata: [{ name: 'Tanglin', label_location: { latitude: 1.3, longitude: 103.8 } }],
            items: [{ update_timestamp: '2026-01-01T00:00:00Z', forecasts: [{ area: 'Tanglin', forecast: 'Cloudy' }] }],
          },
        });
      }
      return okJson({ code: 0 });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not refetch from the provider for a repeat call with the same coordinates', async () => {
    const client = new SingaporeWeatherClient();

    await client.getEnrichedWeather(1.3, 103.8);
    const callsAfterFirst = fetchMock.mock.calls.length;
    await client.getEnrichedWeather(1.3, 103.8);

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it('fetches fresh data for different coordinates', async () => {
    const client = new SingaporeWeatherClient();

    await client.getEnrichedWeather(1.3, 103.8);
    const callsAfterFirst = fetchMock.mock.calls.length;
    await client.getEnrichedWeather(1.35, 103.85);

    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst * 2);
  });
});
